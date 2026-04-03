import { MazeGrid } from '../data/maze';
import { GameState } from './types';
import { tickPlayer } from './movement';
import { checkPelletCollection } from './collision';

// Returns a new immutable GameState advanced by dt seconds.
export function tickGame(state: GameState, dt: number, maze: MazeGrid): GameState {
  if (state.phase !== 'playing') return state;

  let s = tickPlayer(state, dt, maze);
  s = checkPelletCollection(s, maze);
  return s;
}
