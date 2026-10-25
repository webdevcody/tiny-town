// World scale. 1 world unit = 1 metre. Buildings are measured in tiles.
//
//   +X = east, -Z = north, +Y = up.
//   The building's FRONT (main entrance / street side) faces +Z (south).
//   Origin = centre of the footprint, on the ground (y = 0).

/** Edge length of one map tile, in world units (metres). */
export const TILE = 10;

/** Height of one storey, in world units. */
export const FLOOR = 3;

/** Thickness of the ground "lot" slab returned by lot(). Put things on top of it. */
export const LOT_HEIGHT = 0.15;

/** Convert tiles to world units: tiles(2) === 20. */
export function tiles(n) {
  return n * TILE;
}

/** Convert storeys to world units: floors(4) === 12. */
export function floors(n) {
  return n * FLOOR;
}

/**
 * World-space size of a footprint.
 * footprintSize([2, 1]) -> { width: 20, depth: 10, halfW: 10, halfD: 5 }
 */
export function footprintSize(footprint) {
  const [w, d] = footprint;
  return { width: w * TILE, depth: d * TILE, halfW: (w * TILE) / 2, halfD: (d * TILE) / 2 };
}
