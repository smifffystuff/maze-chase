import { INITIAL_LIVES, TILE_SIZE } from '../data/constants';
import { MAZE_LEVEL_1, MazeGrid } from '../data/maze';
import { GameState, PlayerState } from './types';

// Player starts at the open corridor below the ghost-house (row 23, col 13)
const PLAYER_START_COL = 13;
const PLAYER_START_ROW = 23;

function buildPelletSets(maze: MazeGrid): {
  pellets: Set<string>;
  powerPills: Set<string>;
} {
  const pellets = new Set<string>();
  const powerPills = new Set<string>();

  for (let row = 0; row < maze.length; row++) {
    for (let col = 0; col < maze[row].length; col++) {
      const tile = maze[row][col];
      if (tile === 'pellet') pellets.add(`${col},${row}`);
      else if (tile === 'power-pill') powerPills.add(`${col},${row}`);
    }
  }

  return { pellets, powerPills };
}

function initialPlayer(): PlayerState {
  return {
    tile: { x: PLAYER_START_COL, y: PLAYER_START_ROW },
    pixel: { x: PLAYER_START_COL * TILE_SIZE, y: PLAYER_START_ROW * TILE_SIZE },
    direction: 'none',
    nextDirection: 'none',
    moving: false,
  };
}

export function createInitialState(maze: MazeGrid = MAZE_LEVEL_1): GameState {
  const { pellets, powerPills } = buildPelletSets(maze);

  return {
    player: initialPlayer(),
    pellets,
    powerPills,
    score: 0,
    lives: INITIAL_LIVES,
    level: 1,
    phase: 'playing',
  };
}

export function resetPlayer(state: GameState): GameState {
  return { ...state, player: initialPlayer() };
}
