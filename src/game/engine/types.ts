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

export interface GameState {
  player: PlayerState;
  pellets: Set<string>;       // "col,row" keys for remaining pellets
  powerPills: Set<string>;    // "col,row" keys for remaining power-pills
  score: number;
  lives: number;
  level: number;
  phase: 'playing' | 'level-complete' | 'game-over' | 'dying';
}
