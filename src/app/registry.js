// Automatic building discovery. Every folder in buildings/ with a building.js
// and meta.json shows up here; there is no list to edit.

const metas = import.meta.glob('../../buildings/*/meta.json', { eager: true, import: 'default' });
const modules = import.meta.glob('../../buildings/*/building.js');

const slugOf = (path) => path.split('/').at(-2);

/** All buildings: [{ slug, meta, load }], sorted by category then name. */
export const BUILDINGS = Object.keys(modules)
  .map((path) => {
    const slug = slugOf(path);
    const meta = metas[path.replace(/building\.js$/, 'meta.json')] ?? {
      name: slug,
      category: 'unknown',
      footprint: [1, 1],
      description: '(meta.json missing)',
    };
    return { slug, meta, load: modules[path] };
  })
  .sort((a, b) => a.meta.category.localeCompare(b.meta.category) || a.meta.name.localeCompare(b.meta.name));

export function findBuilding(slug) {
  return BUILDINGS.find((b) => b.slug === slug) ?? null;
}

/** Import a building module and call its default export -> THREE.Group. */
export async function buildBuilding(entry) {
  const mod = await entry.load();
  const fn = mod.default;
  if (typeof fn !== 'function') throw new Error(`${entry.slug}/building.js must default-export a function`);
  const obj = await fn({ slug: entry.slug, meta: entry.meta });
  if (!obj || !obj.isObject3D) throw new Error(`${entry.slug}: build() did not return a THREE.Group`);
  return obj;
}
