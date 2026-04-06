import { GHOST_EAT_FREEZE, GHOST_EAT_SCORES, PELLET_SCORE, POWER_PILL_SCORE, SCORE_POPUP_DURATION, TILE_SIZE } from '../data/constants';
import { MazeGrid } from '../data/maze';
import { applyPowerPill } from './powerPill';
import { GameState } from './types';

export function checkPelletCollection(state: GameState, maze: MazeGrid): GameState {
  const { tile } = state.player;

  const key = `${tile.x},${tile.y}`;
  const tiletype = maze[tile.y]?.[tile.x];

  if (tiletype === 'pellet' && state.pellets.has(key)) {
    const pellets = new Set(state.pellets);
    pellets.delete(key);
    const phase = pellets.size === 0 ? 'level-complete' : state.phase;
    return { ...state, pellets, score: state.score + PELLET_SCORE, phase, pelletsEatenThisLevel: state.pelletsEatenThisLevel + 1 };
  }

  if (tiletype === 'power-pill' && state.powerPills.has(key)) {
    const powerPills = new Set(state.powerPills);
    powerPills.delete(key);
    const afterPill = applyPowerPill({ ...state, powerPills });
    return { ...afterPill, score: afterPill.score + POWER_PILL_SCORE };
  }

  return state;
}

const HALF_TILE = TILE_SIZE / 2; // collision threshold in pixels

export function checkGhostCollision(state: GameState): GameState {
  const { pixel: pp } = state.player;
  const pcx = pp.x + HALF_TILE;
  const pcy = pp.y + HALF_TILE;

  let s = state;

  for (const ghost of s.ghosts) {
    const gcx = ghost.pixel.x + HALF_TILE;
    const gcy = ghost.pixel.y + HALF_TILE;

    const dx = Math.abs(pcx - gcx);
    const dy = Math.abs(pcy - gcy);

    if (dx >= HALF_TILE || dy >= HALF_TILE) continue;

    if (ghost.mode === 'eaten') continue;

    if (ghost.mode === 'frightened') {
      const comboIndex = Math.min(s.ghostEatCombo, GHOST_EAT_SCORES.length - 1);
      const points = GHOST_EAT_SCORES[comboIndex];

      const updatedGhosts = s.ghosts.map(g =>
        g.name === ghost.name
          ? { ...g, mode: 'eaten' as const, eaten: true, frightenedTimer: 0, flashingTimer: 0 }
          : g,
      );

      const popup = {
        pixel: { ...ghost.pixel },
        score: points,
        remaining: SCORE_POPUP_DURATION,
      };

      return {
        ...s,
        ghosts: updatedGhosts,
        score: s.score + points,
        ghostEatCombo: s.ghostEatCombo + 1,
        ghostsEatenThisLevel: s.ghostsEatenThisLevel + 1,
        freezeTimer: GHOST_EAT_FREEZE,
        scorePopups: [...s.scorePopups, popup],
      };
    }

    // Normal ghost — player dies
    return { ...s, phase: 'dying' };
  }

  return s;
}
