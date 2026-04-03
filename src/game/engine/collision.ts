import { PELLET_SCORE, POWER_PILL_SCORE } from '../data/constants';
import { MazeGrid } from '../data/maze';
import { GameState } from './types';

export function checkPelletCollection(state: GameState, maze: MazeGrid): GameState {
  const { tile } = state.player;

  // Collect whenever the player occupies a tile — `tile` only advances when the
  // player crosses a tile centre, so this fires exactly once per tile entered.
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

  // Ghost-spawn tile — player loses a life (placeholder for ghost collision)
  if (tiletype === 'ghost-spawn' && state.phase === 'playing') {
    return { ...state, phase: 'dying' };
  }

  return state;
}
