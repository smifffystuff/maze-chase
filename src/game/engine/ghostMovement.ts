import { COLS, EATEN_SPEED, FRIGHTENED_SPEED, GHOST_HOUSE_EXIT, GHOST_SPEED, ROWS, TILE_SIZE } from '../data/constants';
import { MazeGrid } from '../data/maze';
import { Direction, GhostMode, GhostState, PlayerState, Vec2 } from './types';

const DELTAS: Record<Direction, Vec2> = {
  right: { x: 1,  y: 0  },
  left:  { x: -1, y: 0  },
  down:  { x: 0,  y: 1  },
  up:    { x: 0,  y: -1 },
  none:  { x: 0,  y: 0  },
};

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
const REVERSE: Record<Direction, Direction> = {
  up: 'down', down: 'up', left: 'right', right: 'left', none: 'none',
};

function wrapCol(col: number): number {
  return ((col % COLS) + COLS) % COLS;
}

function isPassable(tile: Vec2, maze: MazeGrid): boolean {
  const col = wrapCol(tile.x);
  const row = tile.y;
  if (row < 0 || row >= ROWS) return false;
  return maze[row][col] !== 'wall';
}

function dist2(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function offsetAlongAxis(pixel: Vec2, tile: Vec2, dir: Direction): number {
  switch (dir) {
    case 'right': return pixel.x - tile.x * TILE_SIZE;
    case 'left':  return tile.x * TILE_SIZE - pixel.x;
    case 'down':  return pixel.y - tile.y * TILE_SIZE;
    case 'up':    return tile.y * TILE_SIZE - pixel.y;
    default:      return 0;
  }
}

// Compute the 4-tiles-ahead tile for Pinky, clamped to bounds.
function tilesAhead(origin: Vec2, dir: Direction, steps: number): Vec2 {
  const d = DELTAS[dir === 'none' ? 'right' : dir];
  return { x: origin.x + d.x * steps, y: origin.y + d.y * steps };
}

// Inky: mirror Blinky's position through the pivot (2 tiles ahead of player).
function inkyTarget(player: PlayerState, blinky: GhostState): Vec2 {
  const pivot = tilesAhead(player.tile, player.direction, 2);
  return {
    x: 2 * pivot.x - blinky.tile.x,
    y: 2 * pivot.y - blinky.tile.y,
  };
}

// Returns the target tile for a ghost given the current game context.
export function getTargetTile(
  ghost: GhostState,
  player: PlayerState,
  ghosts: GhostState[],
  mode: GhostMode,
): Vec2 {
  if (ghost.inHouse) {
    // While inside the house, always head for the exit
    return { x: GHOST_HOUSE_EXIT.col, y: GHOST_HOUSE_EXIT.row };
  }

  if (mode === 'scatter') return ghost.scatterCorner;

  // Chase targets per ghost personality
  switch (ghost.name) {
    case 'blinky':
      return { ...player.tile };

    case 'pinky':
      return tilesAhead(player.tile, player.direction, 4);

    case 'inky': {
      const blinky = ghosts.find(g => g.name === 'blinky');
      if (!blinky) return { ...player.tile };
      return inkyTarget(player, blinky);
    }

    case 'clyde': {
      // Chase if > 8 tiles away, otherwise scatter
      const d2 = dist2(ghost.tile, player.tile);
      return d2 > 64 ? { ...player.tile } : ghost.scatterCorner;
    }
  }
}

// Chooses the best exit direction at a tile centre.
// Ghosts never reverse direction outside the house.
// At the ghost-house exit tile, only 'up' is allowed.
export function chooseDirection(
  ghost: GhostState,
  target: Vec2,
  maze: MazeGrid,
): Direction {
  const { tile, direction, inHouse } = ghost;

  // At the house exit gate, force upward
  if (tile.x === GHOST_HOUSE_EXIT.col && tile.y === GHOST_HOUSE_EXIT.row) {
    return 'up';
  }

  const forbidden = inHouse ? 'none' : REVERSE[direction];
  let best: Direction = 'none';
  let bestDist = Infinity;

  for (const d of DIRECTIONS) {
    if (d === forbidden) continue;
    const next = { x: wrapCol(tile.x + DELTAS[d].x), y: tile.y + DELTAS[d].y };
    if (!isPassable(next, maze)) continue;
    const d2 = dist2(next, target);
    if (d2 < bestDist) {
      bestDist = d2;
      best = d;
    }
  }

  return best === 'none' ? direction : best;
}

// Pick a random valid exit direction (not reverse, not wall).
function chooseFrightenedDirection(ghost: GhostState, maze: MazeGrid): Direction {
  const { tile, direction } = ghost;
  const forbidden = REVERSE[direction];
  const valid: Direction[] = [];

  for (const d of DIRECTIONS) {
    if (d === forbidden) continue;
    const next = { x: wrapCol(tile.x + DELTAS[d].x), y: tile.y + DELTAS[d].y };
    if (isPassable(next, maze)) valid.push(d);
  }

  if (valid.length === 0) return direction;
  return valid[Math.floor(Math.random() * valid.length)];
}

// Advance a ghost by dt seconds. Returns new GhostState.
export function tickGhost(
  ghost: GhostState,
  dt: number,
  target: Vec2,
  maze: MazeGrid,
): GhostState {
  let { pixel, tile, direction, inHouse } = ghost;

  const speedTilesPerSec =
    ghost.mode === 'frightened' ? FRIGHTENED_SPEED :
    ghost.mode === 'eaten'      ? EATEN_SPEED :
    GHOST_SPEED;
  const speed = speedTilesPerSec * TILE_SIZE; // px/s
  let remaining = speed * dt;

  // If ghost has no direction yet, pick one immediately
  if (direction === 'none') {
    direction = chooseDirection(ghost, target, maze);
    if (direction === 'none') return ghost;
  }

  while (remaining > 0) {
    const offset = offsetAlongAxis(pixel, tile, direction);
    const distToNext = TILE_SIZE - offset;

    if (remaining < distToNext) {
      const d = DELTAS[direction];
      pixel = { x: pixel.x + d.x * remaining, y: pixel.y + d.y * remaining };
      remaining = 0;
    } else {
      remaining -= distToNext;

      // Advance to next tile
      const raw = { x: tile.x + DELTAS[direction].x, y: tile.y + DELTAS[direction].y };
      const wrappedCol = wrapCol(raw.x);
      tile = { x: wrappedCol, y: raw.y };
      pixel = { x: tile.x * TILE_SIZE, y: tile.y * TILE_SIZE };

      // Exit house once the ghost reaches the gate tile
      if (inHouse && tile.x === GHOST_HOUSE_EXIT.col && tile.y === GHOST_HOUSE_EXIT.row) {
        inHouse = false;
      }

      // Eaten ghost arrives home — re-enter house and clear eaten state
      if (ghost.mode === 'eaten' && tile.x === GHOST_HOUSE_EXIT.col && tile.y === GHOST_HOUSE_EXIT.row) {
        return { ...ghost, pixel, tile, direction, inHouse: true, eaten: false };
      }

      // Choose next direction at new tile centre
      const partialGhost: GhostState = { ...ghost, tile, direction, inHouse };
      direction =
        ghost.mode === 'frightened'
          ? chooseFrightenedDirection(partialGhost, maze)
          : chooseDirection(partialGhost, target, maze);
      if (direction === 'none') {
        remaining = 0;
      }
    }
  }

  return { ...ghost, pixel, tile, direction, inHouse };
}
