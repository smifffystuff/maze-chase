import { MazeGrid } from '../data/maze';
import { GameState, GhostMode, GhostState } from './types';
import { tickPlayer } from './movement';
import { checkGhostCollision, checkPelletCollection } from './collision';
import { tickModeController } from './modeController';
import { getTargetTile, tickGhost } from './ghostMovement';

// Returns a new immutable GameState advanced by dt seconds.
export function tickGame(state: GameState, dt: number, maze: MazeGrid): GameState {
  if (state.phase !== 'playing') return state;

  const dtMs = dt * 1000;
  const newModeElapsed = state.modeElapsed + dtMs;
  const newMode = tickModeController(newModeElapsed);
  const modeChanged = newMode !== state.currentGhostMode;

  let s = tickPlayer(state, dt, maze);

  // Tick each ghost
  const updatedGhosts: GhostState[] = s.ghosts.map(ghost => {
    // Don't release ghost until its delay has elapsed
    if (ghost.inHouse && newModeElapsed < ghost.releaseDelay) return ghost;

    const target = getTargetTile(ghost, s.player, s.ghosts, newMode);
    let updated = tickGhost(ghost, dt, target, maze);

    // On mode change, reverse direction (classic behaviour) — but not while in house
    if (modeChanged && !ghost.inHouse) {
      updated = { ...updated, mode: newMode };
      // Direction reversal happens naturally at the next tile centre via chooseDirection;
      // we force it here by flipping immediately.
      const REVERSE: Record<string, string> = {
        up: 'down', down: 'up', left: 'right', right: 'left', none: 'none',
      };
      updated = { ...updated, direction: REVERSE[updated.direction] as GhostState['direction'] };
    } else {
      updated = { ...updated, mode: newMode };
    }

    return updated;
  });

  s = { ...s, ghosts: updatedGhosts, modeElapsed: newModeElapsed, currentGhostMode: newMode };
  s = checkPelletCollection(s, maze);
  s = checkGhostCollision(s);
  return s;
}
