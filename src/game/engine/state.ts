import { INITIAL_LIVES, TILE_SIZE } from '../data/constants';
import { MAZE_LEVEL_1, MazeGrid } from '../data/maze';
import { GameState, GhostState, PlayerState } from './types';

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

// Ghost starting positions:
//   Blinky — just outside the house at the gate; released immediately
//   Pinky  — centre of ghost house interior; released after 2 s
//   Inky   — left of centre; released after 4 s
//   Clyde  — right of centre; released after 6 s
//
// Scatter corners (classic layout):
//   Blinky → top-right   Pinky → top-left
//   Inky   → bottom-right  Clyde → bottom-left
function initialGhosts(): GhostState[] {
  return [
    {
      name: 'blinky',
      tile:  { x: 13, y: 11 },
      pixel: { x: 13 * TILE_SIZE, y: 11 * TILE_SIZE },
      direction: 'left',
      mode: 'scatter',
      colour: '#ff0000',
      scatterCorner: { x: 25, y: 0 },
      inHouse: false,
      releaseDelay: 0,
      frightenedTimer: 0,
      flashingTimer: 0,
      eaten: false,
    },
    {
      name: 'pinky',
      tile:  { x: 13, y: 13 },
      pixel: { x: 13 * TILE_SIZE, y: 13 * TILE_SIZE },
      direction: 'up',
      mode: 'scatter',
      colour: '#ffb8ff',
      scatterCorner: { x: 2, y: 0 },
      inHouse: true,
      releaseDelay: 2000,
      frightenedTimer: 0,
      flashingTimer: 0,
      eaten: false,
    },
    {
      name: 'inky',
      tile:  { x: 11, y: 13 },
      pixel: { x: 11 * TILE_SIZE, y: 13 * TILE_SIZE },
      direction: 'up',
      mode: 'scatter',
      colour: '#00ffff',
      scatterCorner: { x: 27, y: 30 },
      inHouse: true,
      releaseDelay: 4000,
      frightenedTimer: 0,
      flashingTimer: 0,
      eaten: false,
    },
    {
      name: 'clyde',
      tile:  { x: 15, y: 13 },
      pixel: { x: 15 * TILE_SIZE, y: 13 * TILE_SIZE },
      direction: 'up',
      mode: 'scatter',
      colour: '#ffb852',
      scatterCorner: { x: 0, y: 30 },
      inHouse: true,
      releaseDelay: 6000,
      frightenedTimer: 0,
      flashingTimer: 0,
      eaten: false,
    },
  ];
}

export function createInitialState(maze: MazeGrid = MAZE_LEVEL_1): GameState {
  const { pellets, powerPills } = buildPelletSets(maze);

  return {
    player: initialPlayer(),
    ghosts: initialGhosts(),
    pellets,
    powerPills,
    score: 0,
    lives: INITIAL_LIVES,
    level: 1,
    phase: 'playing',
    modeElapsed: 0,
    currentGhostMode: 'scatter',
    ghostEatCombo: 0,
    freezeTimer: 0,
    scorePopups: [],
  };
}

export function resetPlayer(state: GameState): GameState {
  return {
    ...state,
    player: initialPlayer(),
    ghosts: initialGhosts(),
    modeElapsed: 0,
    currentGhostMode: 'scatter',
    ghostEatCombo: 0,
    freezeTimer: 0,
    scorePopups: [],
  };
}
