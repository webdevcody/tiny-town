// Parses the table in CATALOGUE.md so the gallery can show planned buildings.
import raw from '../../CATALOGUE.md?raw';

/** [{ n, slug, name, category, footprint: [w, d], look }] */
export const CATALOGUE = raw
  .split('\n')
  .filter((l) => /^\|\s*\d+\s*\|/.test(l))
  .map((l) => {
    const c = l.split('|').slice(1, -1).map((s) => s.trim());
    const [w, d] = c[4].split('x').map(Number);
    return { n: Number(c[0]), slug: c[1].replace(/`/g, ''), name: c[2], category: c[3], footprint: [w, d], look: c[5] };
  });
