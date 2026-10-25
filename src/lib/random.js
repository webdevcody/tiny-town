// Deterministic pseudo-random numbers, so a building looks identical in every
// render and every screenshot. Never use Math.random() in a building.

function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/**
 * rng(seed) -> generator. seed may be a number or a string (e.g. your slug).
 *   r()                 float in [0, 1)
 *   r.range(a, b)       float in [a, b)
 *   r.int(a, b)         integer in [a, b] (inclusive)
 *   r.pick(array)       random element
 *   r.chance(p)         true with probability p
 *   r.shuffle(array)    new shuffled copy
 */
export function rng(seed = 1) {
  let a = typeof seed === 'string' ? hashString(seed) : seed >>> 0 || 1;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (lo, hi) => lo + (hi - lo) * next();
  next.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * next());
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.chance = (p) => next() < p;
  next.shuffle = (arr) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  return next;
}
