# 02 — MVP (Playable Core)

## Goal
A fully playable game loop with no ghosts. The player can navigate the maze, collect all pellets, see a score, lose a life by walking into a ghost-spawn tile (placeholder), and restart. This is the foundation every other feature builds on.

## Scope
- Maze grid data + renderer
- Player entity (movement, animation, wall collision)
- Pellets (placement, collection, win condition)
- Keyboard + swipe input
- Basic HUD (score, lives)
- Game-over and level-complete states
- Restart flow

Ghosts, power pills, and audio are out of scope here.

---

## Data Layer (`src/game/data/`)

### `maze.ts`
Define the maze as a 2D array of tile types:
```ts
export type TileType = 'wall' | 'corridor' | 'pellet' | 'power-pill' | 'ghost-spawn' | 'empty';
export type MazeGrid = TileType[][];
```
Hard-code a single level grid (28 columns × 31 rows, matching the classic layout proportions). Export `MAZE_LEVEL_1: MazeGrid`.

### `constants.ts`
```ts
export const TILE_SIZE = 16;          // px per tile at base resolution
export const COLS = 28;
export const ROWS = 31;
export const PLAYER_SPEED = 8;       // tiles per second
export const INITIAL_LIVES = 3;
export const PELLET_SCORE = 10;
export const POWER_PILL_SCORE = 50;
```

---

## Engine (`src/game/engine/`)

### `types.ts`
```ts
export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

export interface Vec2 { x: number; y: number; }

export interface GameState {
  player: PlayerState;
  pellets: Set<string>;        // "col,row" keys for remaining pellets
  powerPills: Set<string>;
  score: number;
  lives: number;
  level: number;
  phase: 'playing' | 'level-complete' | 'game-over' | 'dying';
}

export interface PlayerState {
  tile: Vec2;                  // current tile (col, row)
  pixel: Vec2;                 // sub-pixel position for smooth movement
  direction: Direction;
  nextDirection: Direction;    // buffered input
  moving: boolean;
}
```

### `state.ts`
`createInitialState(): GameState` — builds fresh state from `MAZE_LEVEL_1`, placing pellets on every `'pellet'` tile and power pills on every `'power-pill'` tile.

### `movement.ts`
`tickPlayer(state: GameState, dt: number, maze: MazeGrid): GameState`
- Pixel-based movement with tile snapping
- Apply `nextDirection` when the player reaches a tile centre and the target tile is not a wall
- Fall back to `direction` if `nextDirection` is blocked
- Stop at walls
- Handle tunnel wrap (left/right edges of the maze)

### `collision.ts`
`checkPelletCollection(state: GameState): GameState`
- When player pixel aligns with a pellet tile centre, remove from `pellets` set, add to score
- If `pellets` is empty → set `phase = 'level-complete'`

### `loop.ts`
`tickGame(state: GameState, dt: number, maze: MazeGrid): GameState`
- Calls `tickPlayer` → `checkPelletCollection` in order
- Returns the new state (immutable — always return a new object)

---

## Input (`src/game/input/`)

### `keyboard.ts`
`createKeyboardInput()` — attaches `keydown` listener, maps Arrow keys and WASD to `Direction`, exposes `getDirection(): Direction` and `destroy()`.

### `touch.ts`
`createTouchInput(element: HTMLElement)` — tracks `touchstart`/`touchend`, computes swipe direction from delta (minimum 20 px threshold), exposes same interface as keyboard input.

### `inputManager.ts`
Merges keyboard and touch inputs. Returns a single `Direction` per frame (keyboard takes priority).

---

## Render (`src/game/render/`)

### `renderer.ts`
`Renderer` class, constructed with a `HTMLCanvasElement`.

**`drawMaze(maze: MazeGrid)`**
- Wall tiles: filled rectangles in `--color-wall` blue
- Corridor/pellet/empty tiles: black fill
- Pellet tiles: small white circle (3 px radius) if still in `pellets` set
- Power-pill tiles: larger white circle (6 px radius) if still in `powerPills` set

**`drawPlayer(player: PlayerState)`**
- Yellow filled circle at pixel position
- Mouth opening/closing based on movement (simple arc animation using a frame counter)

**`clear()`** — clears the canvas each frame.

**`scaleToFit(canvas: HTMLCanvasElement)`** — call on resize; scales the canvas logical size to `COLS × TILE_SIZE` by `ROWS × TILE_SIZE` and uses CSS to fit within the viewport while maintaining aspect ratio.

---

## Game Hook (`src/hooks/useGameLoop.ts`)

```ts
function useGameLoop(canvasRef: RefObject<HTMLCanvasElement>): {
  score: number;
  lives: number;
  phase: GameState['phase'];
  restart: () => void;
}
```

- Creates `Renderer`, `InputManager`, and initial `GameState` on mount
- Runs a `requestAnimationFrame` loop with a fixed timestep (16 ms / ~60 fps)
- Accumulates `dt`, steps the simulation in fixed increments, renders once per frame
- On `phase === 'dying'`: decrement lives, reset player position after a 1.5 s pause
- On `phase === 'game-over'` or `'level-complete'`: stop the loop, surface the phase to React
- `restart()` resets state and restarts the loop
- Returns only `score`, `lives`, `phase`, and `restart` to React (not the full game state)

---

## HUD Component (`src/components/`)

### `Hud.tsx`
Positioned absolutely over the canvas. Shows:
- Score (top-left)
- Lives as icons (top-right, e.g. three small player circles)
- "LEVEL COMPLETE" or "GAME OVER" overlay when phase changes, with a Restart button (shadcn `<Button>`)

---

## Wiring in `GameShell.tsx`
1. `const { score, lives, phase, restart } = useGameLoop(canvasRef)`
2. Render `<Hud score={score} lives={lives} phase={phase} onRestart={restart} />`
3. Render `<canvas ref={canvasRef} />`

---

## Acceptance Criteria
- [ ] Maze renders correctly with walls, corridors, and pellets visible
- [ ] Player moves smoothly in four directions, stops at walls
- [ ] Input direction is buffered — queuing a turn before the tile centre is reached applies it on arrival
- [ ] Tunnel wrap works (exit left → appear right, and vice versa)
- [ ] Pellets disappear on collection; score increments
- [ ] All pellets cleared → "LEVEL COMPLETE" overlay appears
- [ ] Player has 3 lives; restart resets everything
- [ ] 60 FPS maintained (check with browser DevTools)
- [ ] Zero TypeScript errors; game engine has no imports from `react` or browser DOM APIs
