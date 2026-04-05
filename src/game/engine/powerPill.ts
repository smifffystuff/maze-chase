import { FRIGHTENED_DURATION, FRIGHTENED_FLASH_START } from '../data/constants';
import { GameState, GhostState } from './types';
import { tickModeController } from './modeController';

const REVERSE: Record<string, GhostState['direction']> = {
  up: 'down', down: 'up', left: 'right', right: 'left', none: 'none',
};

// Called when the player collects a power-pill tile.
// Frightens all non-eaten ghosts, reverses their direction, resets combo.
export function applyPowerPill(state: GameState): GameState {
  const ghosts = state.ghosts.map(g => {
    if (g.eaten) return g;
    return {
      ...g,
      mode: 'frightened' as const,
      frightenedTimer: FRIGHTENED_DURATION,
      flashingTimer: 0,
      direction: REVERSE[g.direction],
    };
  });
  return { ...state, ghosts, ghostEatCombo: 0 };
}

// Ticks frightened timers for all frightened ghosts.
// When time runs out, restores the ghost to the current scatter/chase mode.
// When time falls below FRIGHTENED_FLASH_START, sets flashingTimer.
export function tickFrightened(ghosts: GhostState[], dtMs: number, modeElapsed: number): GhostState[] {
  const currentMode = tickModeController(modeElapsed);

  return ghosts.map(g => {
    if (g.mode !== 'frightened') return g;

    const newTimer = g.frightenedTimer - dtMs;
    if (newTimer <= 0) {
      return { ...g, mode: currentMode, frightenedTimer: 0, flashingTimer: 0 };
    }

    const flashingTimer = newTimer <= FRIGHTENED_FLASH_START ? newTimer : 0;
    return { ...g, frightenedTimer: newTimer, flashingTimer };
  });
}
