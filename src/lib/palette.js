// Low-poly, slightly saturated OpenTTD-ish colour palette.
// Use these names instead of ad-hoc hex values so the town looks coherent.

export const PALETTE = {
  // ground
  grass: '#5d9139',
  grassDark: '#477a2c',
  grassLight: '#7aa84a',
  dirt: '#8a6a44',
  mud: '#6e5236',
  sand: '#d9c48c',
  gravel: '#9a958a',
  asphalt: '#47474c',
  roadLine: '#e8e2c8',
  concrete: '#bcb8ae',
  concreteDark: '#8f8b83',
  pavement: '#aaa69c',
  paving: '#c4b49a',

  // walls
  white: '#f1eee6',
  offWhite: '#e4e0d4',
  cream: '#eadbb5',
  beige: '#d8c39a',
  sandstone: '#cfae7c',
  ochre: '#c99a4a',
  peach: '#e6b394',
  pink: '#d99b9b',
  salmon: '#d97b62',
  brick: '#a8462f',
  brickDark: '#7c3325',
  brickBrown: '#8b5a3c',
  stone: '#a9a296',
  stoneDark: '#7d776d',
  plasterBlue: '#9fb7c9',
  plasterGreen: '#a9c09a',
  plasterYellow: '#e8d27a',

  // roofs
  roofRed: '#b23c2e',
  terracotta: '#c45a30',
  roofBrown: '#6d4631',
  roofSlate: '#4e5765',
  roofGrey: '#77797c',
  roofGreen: '#4f8b6f', // copper patina
  roofBlue: '#3f5f8b',
  roofBlack: '#2d2f33',
  thatch: '#c8a75a',

  // glass & metal
  glassBlue: '#6f9fca',
  glassSky: '#9cc6e4',
  glassTeal: '#5bb2ae',
  glassGreen: '#7fb59a',
  glassDark: '#2e4259',
  glassGold: '#c8a659',
  glassBronze: '#8a6a4a',
  window: '#2d3f57',
  windowLit: '#ffe7a0',
  frame: '#ebe7dc',
  steel: '#909ba4',
  steelLight: '#c3cad0',
  steelDark: '#5c656d',
  aluminium: '#d4d8dc',
  rust: '#9b502b',
  chrome: '#dfe4e8',

  // wood & nature
  wood: '#9c6b3f',
  woodDark: '#6b4a2b',
  woodLight: '#c49a66',
  trunk: '#5a3d22',
  foliage: '#3f7e2f',
  foliageDark: '#2f6224',
  foliageLight: '#6ca83b',
  autumn: '#d08a2a',
  hay: '#d9b858',
  wheat: '#e2c45a',
  water: '#3ea6c8',
  waterDeep: '#2b7fa6',
  pool: '#4fd2e2',

  // accents
  red: '#c8322b',
  orange: '#e27a1e',
  yellow: '#e9c31f',
  green: '#3a9a4a',
  blue: '#2f6fbf',
  navy: '#24395e',
  purple: '#7a4d9a',
  black: '#232326',
  darkGrey: '#3c3d42',
  grey: '#7b7d82',
  lightGrey: '#c9cacc',
};

/** Handy colour sets to pick from with rng().pick(...). */
export const SWATCHES = {
  houseWalls: [PALETTE.white, PALETTE.cream, PALETTE.beige, PALETTE.peach, PALETTE.plasterBlue, PALETTE.plasterGreen, PALETTE.plasterYellow, PALETTE.pink],
  roofs: [PALETTE.roofRed, PALETTE.terracotta, PALETTE.roofBrown, PALETTE.roofSlate, PALETTE.roofGrey],
  bricks: [PALETTE.brick, PALETTE.brickDark, PALETTE.brickBrown],
  glass: [PALETTE.glassBlue, PALETTE.glassSky, PALETTE.glassTeal, PALETTE.glassGreen, PALETTE.glassDark, PALETTE.glassGold],
  containers: [PALETTE.red, PALETTE.blue, PALETTE.green, PALETTE.orange, PALETTE.yellow, PALETTE.navy, PALETTE.rust, PALETTE.lightGrey],
  cars: [PALETTE.red, PALETTE.blue, PALETTE.white, PALETTE.black, PALETTE.yellow, PALETTE.grey, PALETTE.green, PALETTE.steelLight],
  awnings: [PALETTE.red, PALETTE.green, PALETTE.blue, PALETTE.orange, PALETTE.yellow, PALETTE.navy],
  foliage: [PALETTE.foliage, PALETTE.foliageDark, PALETTE.foliageLight],
};
