import { PELLET_SCORE, POWER_PILL_SCORE, TILE_SIZE } from '../data/constants';
import { MazeGrid } from '../data/maze';
import { GameState } from './types';

export function checkPelletCollection(state: GameState, maze: MazeGrid): GameState {
  const { tile } = state.player;

  const key = `${tile.x},${tile.y}`;
  const tiletype = maze[tile.y]?.[tile.x];

  if (tiletype === 'pellet' && state.pellets.has(key)) {
    const pellets = new Set(state.pellets);
    pellets.delete(key);
    const phase = pellets.size === 0 ? 'level-complete' : state.phase;
    return { ...state, pellets, score: state.score + PELLET_SCORE, phase };
  }

  if (tiletype === 'power-pill' && state.powerPills.has(key)) {
    const powerPills = new Set(state.powerPills);
    powerPills.delete(key);
    return { ...state, powerPills, score: state.score + POWER_PILL_SCORE };
  }

  return state;
}

const HALF_TILE = TILE_SIZE / 2; // collision threshold in pixels

export function checkGhostCollision(state: GameState): GameState {
  const { pixel: pp } = state.player;
  const pcx = pp.x + HALF_TILE;
  const pcy = pp.y + HALF_TILE;

  for (const ghost of state.ghosts) {
    if (ghost.mode === 'frightened' || ghost.mode === 'eaten') continue;

    const gcx = ghost.pixel.x + HALF_TILE;
    const gcy = ghost.pixel.y + HALF_TILE;

    const dx = Math.abs(pcx - gcx);
    const dy = Math.abs(pcy - gcy);

    if (dx < HALF_TILE && dy < HALF_TILE) {
      return { ...state, phase: 'dying' };
    }
  }

  return state;
}
