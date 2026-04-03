export type TileType =
  | 'wall'
  | 'corridor'
  | 'pellet'
  | 'power-pill'
  | 'ghost-spawn'
  | 'empty';

export type MazeGrid = TileType[][];

// 28 columns × 31 rows — classic Pac-Man proportions.
//
// Template key:
//   W = wall        . = pellet      o = power-pill
//   E = empty       G = ghost-spawn C = corridor (passable, no pellet)
//
// Ghost-house: rows 11-14, cols 10-17
//   Row 11 cols 12-13: gate (C, passable)
//   Row 12 cols 12-14: ghost-spawn tiles (G)
// Tunnel: row 15 — cols 0-5 and 22-27 are corridor exits (movement engine wraps)
// Player start: row 23, col 13
const MAZE_TEMPLATE: readonly string[] = [
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWW', //  0
  'W............WW............W', //  1
  'W.WWWW.WWWWW.WW.WWWWW.WWWW.W', //  2
  'WoWWWW.WWWWW.WW.WWWWW.WWWWoW', //  3  top power-pills at cols 1, 26
  'W.WWWW.WWWWW.WW.WWWWW.WWWW.W', //  4
  'W..........................W', //  5
  'W.WWWW.WW.WWWWWWWW.WW.WWWW.W', //  6
  'W.WWWW.WW.WWWWWWWW.WW.WWWW.W', //  7
  'W......WW....WW....WW......W', //  8
  'WWWWWW.WWWWW.WW.WWWWW.WWWWWW', //  9
  'WWWWWW.WW..........WW.WWWWWW', // 10
  'WWWWWW.WW.WWCCWWWW.WW.WWWWWW', // 11  gate (C) at cols 12-13
  'WWWWWW.WW.WEGGGEEW.WW.WWWWWW', // 12  ghost-spawn (G) at cols 12-14
  'WWWWWW.WW.WEEEEEEW.WW.WWWWWW', // 13  ghost-house interior
  'WWWWWW.WW.WWWWWWWW.WW.WWWWWW', // 14  ghost-house bottom wall
  'CCCCCC.WW..........WW.CCCCCC', // 15  tunnel row (wrap at col 0 / col 27)
  'WWWWWW.WW.WWWWWWWW.WW.WWWWWW', // 16
  'W......WW....WW....WW......W', // 17
  'W.WWWW.WWWWW.WW.WWWWW.WWWW.W', // 18
  'WoWWWW.WWWWW.WW.WWWWW.WWWWoW', // 19  bottom power-pills at cols 1, 26
  'W.WWWW.WWWWW.WW.WWWWW.WWWW.W', // 20
  'W..........................W', // 21
  'W.WWWW.WW.WWWWWWWW.WW.WWWW.W', // 22
  'W.WWWW.WW..........WW.WWWW.W', // 23  player-start tile: col 13
  'W......WW....WW....WW......W', // 24
  'WWWWWW.WWWWW.WW.WWWWW.WWWWWW', // 25
  'WWWWWW.WW..........WW.WWWWWW', // 26
  'W............WW............W', // 27
  'W.WWWW.WWWWW.WW.WWWWW.WWWW.W', // 28
  'W..........................W', // 29
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWW', // 30
];

if (process.env.NODE_ENV !== 'production') {
  MAZE_TEMPLATE.forEach((row, i) => {
    if (row.length !== 28) {
      throw new Error(`Maze row ${i} has length ${row.length}, expected 28`);
    }
  });
}

function charToTile(ch: string): TileType {
  switch (ch) {
    case 'W': return 'wall';
    case '.': return 'pellet';
    case 'o': return 'power-pill';
    case 'E': return 'empty';
    case 'G': return 'ghost-spawn';
    case 'C': return 'corridor';
    default:  return 'empty';
  }
}

export const MAZE_LEVEL_1: MazeGrid = MAZE_TEMPLATE.map(row =>
  row.split('').map(charToTile),
);
