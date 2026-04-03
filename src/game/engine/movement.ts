import { COLS, PLAYER_SPEED, ROWS, TILE_SIZE } from '../data/constants';
import { MazeGrid } from '../data/maze';
import { Direction, GameState, Vec2 } from './types';

const DELTAS: Record<Direction, Vec2> = {
  right: { x: 1, y: 0 },
  left:  { x: -1, y: 0 },
  down:  { x: 0, y: 1 },
  up:    { x: 0, y: -1 },
  none:  { x: 0, y: 0 },
};

function wrapCol(col: number): number {
  return ((col % COLS) + COLS) % COLS;
}

function neighborTile(tile: Vec2, dir: Direction): Vec2 {
  const d = DELTAS[dir];
  return { x: tile.x + d.x, y: tile.y + d.y };
}

function isPassable(tile: Vec2, maze: MazeGrid): boolean {
  const col = wrapCol(tile.x);
  const row = tile.y;
  if (row < 0 || row >= ROWS) return false;
  return maze[row][col] !== 'wall';
}

// How far along we are from the current tile centre toward the next tile centre.
// Always returns a value in [0, TILE_SIZE).
function offsetAlongAxis(pixel: Vec2, tile: Vec2, dir: Direction): number {
  switch (dir) {
    case 'right': return pixel.x - tile.x * TILE_SIZE;
    case 'left':  return tile.x * TILE_SIZE - pixel.x;
    case 'down':  return pixel.y - tile.y * TILE_SIZE;
    case 'up':    return tile.y * TILE_SIZE - pixel.y;
    default:      return 0;
  }
}

export function tickPlayer(state: GameState, dt: number, maze: MazeGrid): GameState {
  let { pixel, tile, direction, nextDirection, moving } = state.player;

  const speed = PLAYER_SPEED * TILE_SIZE; // px / s
  let remaining = speed * dt;             // px to advance this tick

  // If stopped and there is no buffered input, nothing to do
  if (!moving && nextDirection === 'none' && direction === 'none') {
    return state;
  }

  // If stopped but player has a buffered direction, try to start moving
  if (!moving) {
    const tryDir = nextDirection !== 'none' ? nextDirection : direction;
    const target = { x: wrapCol(tile.x + DELTAS[tryDir].x), y: tile.y + DELTAS[tryDir].y };
    if (isPassable(target, maze)) {
      direction = tryDir;
      nextDirection = 'none';
      moving = true;
    } else {
      // The requested direction is blocked; keep buffered and wait
      return { ...state, player: { ...state.player, nextDirection: tryDir } };
    }
  }

  // Advance up to `remaining` px, snapping to tile centres along the way
  while (remaining > 0 && moving && direction !== 'none') {
    const offset = offsetAlongAxis(pixel, tile, direction);
    const distToNext = TILE_SIZE - offset;

    if (remaining < distToNext) {
      // Doesn't reach the next tile centre this tick — just slide
      const d = DELTAS[direction];
      pixel = { x: pixel.x + d.x * remaining, y: pixel.y + d.y * remaining };
      remaining = 0;
    } else {
      // Arrives at (or overshoots) the next tile centre — snap there and re-evaluate
      remaining -= distToNext;

      const raw = neighborTile(tile, direction);
      const wrappedCol = wrapCol(raw.x);

      // Detect a tunnel warp (player exits left or right edge)
      if (raw.x !== wrappedCol) {
        tile = { x: wrappedCol, y: tile.y };
      } else {
        tile = raw;
      }
      pixel = { x: tile.x * TILE_SIZE, y: tile.y * TILE_SIZE };

      // At the new tile centre, attempt to apply the buffered direction
      if (nextDirection !== 'none') {
        const nd = DELTAS[nextDirection];
        const nTarget = { x: wrapCol(tile.x + nd.x), y: tile.y + nd.y };
        if (isPassable(nTarget, maze)) {
          direction = nextDirection;
          nextDirection = 'none';
        }
      }

      // Check if the current direction is still passable ahead
      const ahead = { x: wrapCol(tile.x + DELTAS[direction].x), y: tile.y + DELTAS[direction].y };
      if (!isPassable(ahead, maze)) {
        moving = false;
        remaining = 0;
      }
    }
  }

  return {
    ...state,
    player: { pixel, tile, direction, nextDirection, moving },
  };
}
