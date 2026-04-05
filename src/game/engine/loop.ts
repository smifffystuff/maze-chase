import { MazeGrid } from '../data/maze';
import { GameState, GhostState } from './types';
import { tickPlayer } from './movement';
import { checkGhostCollision, checkPelletCollection } from './collision';
import { tickModeController } from './modeController';
import { getTargetTile, tickGhost } from './ghostMovement';
import { tickFrightened } from './powerPill';
import { GHOST_HOUSE_EXIT } from '../data/constants';

const REVERSE: Record<string, GhostState['direction']> = {
  up: 'down', down: 'up', left: 'right', right: 'left', none: 'none',
};

// Returns a new immutable GameState advanced by dt seconds.
export function tickGame(state: GameState, dt: number, maze: MazeGrid): GameState {
  if (state.phase !== 'playing') return state;

  const dtMs = dt * 1000;

  // Tick score popups regardless of freeze
  const scorePopups = state.scorePopups
    .map(p => ({ ...p, remaining: p.remaining - dtMs }))
    .filter(p => p.remaining > 0);

  // During eat-freeze: only tick the freeze timer and popups; skip all movement
  if (state.freezeTimer > 0) {
    return {
      ...state,
      freezeTimer: Math.max(0, state.freezeTimer - dtMs),
      scorePopups,
    };
  }

  const newModeElapsed = state.modeElapsed + dtMs;
  const newMode = tickModeController(newModeElapsed);
  const modeChanged = newMode !== state.currentGhostMode;

  let s = tickPlayer(state, dt, maze);

  // Tick frightened timers first — may restore ghosts to scatter/chase
  const frightenedTicked = tickFrightened(s.ghosts, dtMs, newModeElapsed);

  // Tick each ghost
  const updatedGhosts: GhostState[] = frightenedTicked.map(ghost => {
    // Don't release ghost until its delay has elapsed
    if (ghost.inHouse && newModeElapsed < ghost.releaseDelay) return ghost;

    // For frightened/eaten ghosts, determine movement target independently
    if (ghost.mode === 'frightened') {
      // Target is unused for frightened (random direction chosen inside tickGhost)
      return tickGhost(ghost, dt, ghost.tile, maze);
    }

    if (ghost.mode === 'eaten') {
      const homeTarget = { x: GHOST_HOUSE_EXIT.col, y: GHOST_HOUSE_EXIT.row };
      const moved = tickGhost(ghost, dt, homeTarget, maze);
      // If tickGhost cleared eaten (arrived at house gate), restore to scatter/chase mode
      if (!moved.eaten) {
        return { ...moved, mode: newMode };
      }
      return moved;
    }

    // Normal scatter/chase ghost
    const target = getTargetTile(ghost, s.player, s.ghosts, newMode);
    let updated = tickGhost(ghost, dt, target, maze);

    // On mode change, reverse direction (classic behaviour) — but not while in house
    if (modeChanged && !ghost.inHouse) {
      updated = {
        ...updated,
        mode: newMode,
        direction: REVERSE[updated.direction],
      };
    } else {
      updated = { ...updated, mode: newMode };
    }

    return updated;
  });

  s = { ...s, ghosts: updatedGhosts, modeElapsed: newModeElapsed, currentGhostMode: newMode, scorePopups };
  s = checkPelletCollection(s, maze);
  s = checkGhostCollision(s);
  return s;
}
