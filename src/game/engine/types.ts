export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerState {
  tile: Vec2;                 // current tile (col, row)
  pixel: Vec2;                // top-left pixel of current tile position (sub-pixel accurate)
  direction: Direction;
  nextDirection: Direction;   // buffered input — applied at next tile centre
  moving: boolean;
}

export type GhostMode = 'scatter' | 'chase' | 'frightened' | 'eaten';
export type GhostName = 'blinky' | 'pinky' | 'inky' | 'clyde';

export interface ScorePopup {
  pixel: Vec2;
  score: number;
  remaining: number; // ms until it disappears
}

export interface GhostState {
  name: GhostName;
  tile: Vec2;           // current tile (col, row)
  pixel: Vec2;          // top-left pixel
  direction: Direction;
  mode: GhostMode;
  colour: string;
  scatterCorner: Vec2;  // tile ghost retreats to in scatter mode
  inHouse: boolean;     // true while ghost is still inside the ghost house
  releaseDelay: number; // ms from game start before ghost leaves the house
  frightenedTimer: number; // ms remaining in frightened state (0 = not frightened)
  flashingTimer: number;   // > 0 when ghost should flash (about to recover)
  eaten: boolean;          // true while returning to ghost house as eyes
}

export interface GameState {
  player: PlayerState;
  ghosts: GhostState[];
  pellets: Set<string>;       // "col,row" keys for remaining pellets
  powerPills: Set<string>;    // "col,row" keys for remaining power-pills
  score: number;
  lives: number;
  level: number;
  phase: 'playing' | 'level-complete' | 'game-over' | 'dying';
  modeElapsed: number;        // ms of playing time elapsed (drives scatter/chase cycle)
  currentGhostMode: GhostMode;
  ghostEatCombo: number;      // ghosts eaten in current power-pill window
  freezeTimer: number;        // ms remaining in eat-freeze pause
  scorePopups: ScorePopup[];
  extraLifeAwarded: boolean;  // true once extra life has been granted at 10,000 pts
  pelletsEatenThisLevel: number; // regular pellets eaten (for level-complete tally)
  ghostsEatenThisLevel: number;  // ghosts eaten this level (for level-complete tally)
}
