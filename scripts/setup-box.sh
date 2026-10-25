#!/usr/bin/env bash
# One-shot, idempotent box setup for Tiny Town:  npm run setup
#
#   1. npm ci            (skipped when node_modules already matches package-lock.json)
#   2. headless Chrome   (puppeteer's chrome-headless-shell in ~/.cache/puppeteer)
#      + the system libraries it needs (apt-get, via sudo when not root)
#   3. renders a test shot of an example building to a temp dir (never touches the repo)
#
# The last line is always "SETUP PASS" (exit 0) or "SETUP FAIL: <reason>" (exit 1).

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TEST_SLUG="suburban-house-pool"
T0=$(date +%s)

# Chrome runtime libraries (Debian/Ubuntu names). On Ubuntu 24.04+ some have a "t64" suffix;
# that variant is tried automatically.
APT_PACKAGES=(
  libglib2.0-0 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2
  libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
  libpango-1.0-0 libcairo2 libx11-xcb1 libxshmfence1 libdbus-1-3 fonts-liberation
)

step() { echo; echo "==> $*"; }
info() { echo "    $*"; }
fail() {
  echo
  echo "SETUP FAIL: $*"
  exit 1
}
elapsed() { echo "$(($(date +%s) - $1))s"; }

# ---------------------------------------------------------------------------
step "0/3 Node.js"
command -v node >/dev/null 2>&1 || fail "node is not installed (need Node.js >= 20.19)"
command -v npm >/dev/null 2>&1 || fail "npm is not installed"
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
NODE_MINOR=$(node -p 'process.versions.node.split(".")[1]')
if [ "$NODE_MAJOR" -lt 20 ] || { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 19 ]; }; then
  fail "Node.js $(node -v) is too old (need >= 20.19 for Vite)"
fi
info "node $(node -v), npm $(npm -v)"

# ---------------------------------------------------------------------------
step "1/3 npm dependencies"
S=$(date +%s)
LOCK_SHA=$(sha256sum package-lock.json | cut -d' ' -f1)
MARKER="node_modules/.setup-lock-sha256"
deps_ok() {
  [ -f "$MARKER" ] && [ "$(cat "$MARKER")" = "$LOCK_SHA" ] || return 1
  for p in three vite puppeteer upng-js; do [ -f "node_modules/$p/package.json" ] || return 1; done
  return 0
}
if deps_ok; then
  info "node_modules matches package-lock.json — skipping npm ci"
else
  info "running npm ci…"
  npm ci --no-audit --no-fund || fail "npm ci failed"
  echo "$LOCK_SHA" >"$MARKER"
fi
info "done in $(elapsed "$S")"

# ---------------------------------------------------------------------------
step "2/3 headless Chrome + system libraries"
S=$(date +%s)
chrome_path() {
  node --input-type=module -e "import p from 'puppeteer'; console.log(await p.executablePath({ headless: 'shell' }))" 2>/dev/null
}
CHROME=$(chrome_path)
if [ -n "$CHROME" ] && [ -x "$CHROME" ]; then
  info "chrome-headless-shell already installed: $CHROME"
else
  info "installing chrome-headless-shell into ~/.cache/puppeteer…"
  npx --no-install puppeteer browsers install chrome-headless-shell || fail "could not download chrome-headless-shell"
  CHROME=$(chrome_path)
  [ -n "$CHROME" ] && [ -x "$CHROME" ] || fail "chrome-headless-shell missing after install"
fi

missing_libs() { ldd "$CHROME" 2>/dev/null | awk '/not found/ {print $1}' | sort -u; }
MISSING=$(missing_libs)

# packages from the list that are not installed yet (resolving t64 renames)
NEED_PKGS=()
if command -v dpkg-query >/dev/null 2>&1; then
  for p in "${APT_PACKAGES[@]}"; do
    if dpkg-query -W -f='${Status}' "$p" 2>/dev/null | grep -q "install ok installed" ||
      dpkg-query -W -f='${Status}' "${p}t64" 2>/dev/null | grep -q "install ok installed"; then
      continue
    fi
    NEED_PKGS+=("$p")
  done
fi

if [ -z "$MISSING" ] && [ ${#NEED_PKGS[@]} -eq 0 ]; then
  info "all system libraries present — skipping apt"
else
  [ -n "$MISSING" ] && info "Chrome is missing: $(echo $MISSING)"
  [ ${#NEED_PKGS[@]} -gt 0 ] && info "packages to install: ${NEED_PKGS[*]}"
  if ! command -v apt-get >/dev/null 2>&1; then
    [ -n "$MISSING" ] && fail "missing system libraries ($(echo $MISSING)) and no apt-get on this box"
    info "no apt-get; Chrome's libraries are present, skipping optional packages"
  else
    SUDO=""
    if [ "$(id -u)" -ne 0 ]; then
      if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
        SUDO="sudo"
      else
        [ -n "$MISSING" ] && fail "missing system libraries ($(echo $MISSING)) and no passwordless sudo — ask for: apt-get install ${NEED_PKGS[*]}"
        info "no sudo; Chrome's libraries are present, skipping optional packages (${NEED_PKGS[*]})"
        SUDO="none"
      fi
    fi
    if [ "$SUDO" != "none" ]; then
      info "apt-get update…"
      $SUDO env DEBIAN_FRONTEND=noninteractive apt-get update -qq >/dev/null 2>&1 || info "(apt-get update reported errors, continuing)"
      RESOLVED=()
      for p in "${NEED_PKGS[@]}"; do
        if apt-cache show "$p" >/dev/null 2>&1 && [ -n "$(apt-cache show "$p" 2>/dev/null | grep -m1 '^Filename:')" ]; then
          RESOLVED+=("$p")
        elif apt-cache show "${p}t64" >/dev/null 2>&1; then
          RESOLVED+=("${p}t64")
        else
          info "(no apt package named $p, skipping)"
        fi
      done
      if [ ${#RESOLVED[@]} -gt 0 ]; then
        info "apt-get install ${RESOLVED[*]}"
        $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends "${RESOLVED[@]}" >/tmp/tiny-town-apt.log 2>&1 ||
          fail "apt-get install failed (see /tmp/tiny-town-apt.log)"
      fi
    fi
  fi
  MISSING=$(missing_libs)
  [ -z "$MISSING" ] || fail "Chrome still misses libraries: $(echo $MISSING)"
fi
info "done in $(elapsed "$S")"

# ---------------------------------------------------------------------------
step "3/3 test render ($TEST_SLUG, software WebGL)"
S=$(date +%s)
OUT=$(mktemp -d /tmp/tiny-town-setup.XXXXXX)
LOG="$OUT/shots.log"
if ! node scripts/shots.mjs "$TEST_SLUG" --out="$OUT" >"$LOG" 2>&1; then
  sed 's/^/    | /' "$LOG" | tail -15
  fail "test render failed (log: $LOG)"
fi
sed 's/^/    /' "$LOG"
for v in iso-ne iso-nw iso-se iso-sw front top; do
  f="$OUT/$TEST_SLUG/$v.png"
  [ -f "$f" ] || fail "test render did not write $v.png"
  size=$(stat -c %s "$f")
  [ "$size" -gt 8000 ] || fail "test render $v.png is only $size bytes (blank image? WebGL not working)"
done
rm -rf "$OUT"
info "done in $(elapsed "$S")"

echo
echo "total $(elapsed "$T0")"
echo "SETUP PASS"
