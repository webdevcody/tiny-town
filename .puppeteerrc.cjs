// The shots script only uses chrome-headless-shell, so skip downloading full Chrome.
// Browsers go to puppeteer's default cache (~/.cache/puppeteer).
module.exports = {
  chrome: { skipDownload: true },
  'chrome-headless-shell': { skipDownload: false },
};
