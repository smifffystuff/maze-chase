# 03 — Ghost AI

## Goal
Add four ghosts with distinct movement behaviours and the classic scatter/chase mode cycle. The player loses a life on collision. No frightened state yet (that comes in 04-power-pills).

## Ghost Identities

| Name   | Colour | Personality       | Chase target                                              |
|--------|--------|-------------------|-----------------------------------------------------------|
| Blinky | Red    | Shadow / Chaser   | Player's current tile                                     |
| Pinky  | Pink   | Speeder / Ambush  | 4 tiles ahead of the player's facing direction            |
| Inky   | Cyan   | Bashful / Complex | Mirror of Blinky's position through a point 2 tiles ahead of the player |
| Clyde  | Orange | Pokey / Shy       | Player's tile if distance > 8 tiles, else scatter corner  |

---

## Data Layer additions (`src/game/data/`)

### `constants.ts` additions
```ts
export const GHOST_SPEED = 6.5;          // tiles per second (slightly slower than player)
export const SCATTER_DURATION = 7000;    // ms
export const CHASE_DURATION = 20000;     // ms
export const GHOST_SPAWN_TILE = { col: 13, row: 14 }; // centre of ghost house
```

---

## Engine additions (`src/game/engine/`)

### `types.ts` additions
```ts
export type GhostMode = 'scatter' | 'chase' | 'frightened' | 'eaten';
export type GhostName = 'blinky' | 'pinky' | 'inky' | 'clyde';

export interface GhostState {
  name: GhostName;
  tile: Vec2;
  pixel: Vec2;
  direction: Direction;
  mode: GhostMode;
  colour: string;
  scatterCorner: Vec2;   // the tile each ghost retreats to in scatter mode
}
```

Add `ghosts: GhostState[]` to `GameState`.

### `ghostMovement.ts`
Each ghost uses **tile-based pathfinding**: at every tile centre, choose the exit direction that minimises distance to the current target tile. Ghosts never reverse direction (except when switching modes).

**`getTargetTile(ghost: GhostState, player: PlayerState, ghosts: GhostState[], mode: GhostMode): Vec2`**
- `scatter` → return `ghost.scatterCorner`
- `chase` → use per-ghost logic (see identities table above)
- `frightened` / `eaten` → handled in 04-power-pills

**`chooseDirection(ghost: GhostState, target: Vec2, maze: MazeGrid): Direction`**
- Evaluate all valid exits (not walls, not reverse direction)
- At ghost-house exit tile, only allow 'up'
- Return direction whose exit tile is closest (Euclidean) to target

**`tickGhost(ghost: GhostState, dt: number, target: Vec2, maze: MazeGrid): GhostState`**
- Same pixel-movement approach as the player
- Apply `chooseDirection` when reaching a tile centre

### `modeController.ts`
Manages the scatter/chase alternation timer.

```ts
// Classic schedule (level 1)
const MODE_SCHEDULE = [
  { mode: 'scatter', duration: 7000 },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 7000 },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 5000 },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 5000 },
  { mode: 'chase',   duration: Infinity },
];
```

`tickModeController(elapsed: number): GhostMode` — returns the current mode for the elapsed game time.

### `collision.ts` additions
**`checkGhostCollision(state: GameState): GameState`**
- If player pixel overlaps any ghost pixel (within half a tile, ~8 px) and ghost mode is not `frightened` or `eaten`:
  - Set `phase = 'dying'`
- Called inside `tickGame` after ghost movement.

### `loop.ts` update
`tickGame` now also:
1. Calls `tickModeController` to get current mode
2. For each ghost, computes target tile and calls `tickGhost`
3. Calls `checkGhostCollision`

---

## Render additions (`src/game/render/`)

### `renderer.ts` additions
**`drawGhost(ghost: GhostState)`**
- Body: rounded rectangle or D-shape in the ghost's colour
- Eyes: two white circles with dark pupils pointing in the direction of travel
- No frightened rendering yet

---

## State initialisation update (`src/game/engine/state.ts`)
`createInitialState()` now includes four ghosts, each starting in the ghost house at staggered positions, all in `scatter` mode.

Ghost scatter corners (classic layout):
- Blinky: top-right
- Pinky: top-left
- Inky: bottom-right
- Clyde: bottom-left

---

## Acceptance Criteria
- [ ] All four ghosts appear and move through the maze
- [ ] Each ghost visually distinguishable by colour and faces its direction of travel
- [ ] Ghosts never reverse mid-corridor (only at decision points or mode switches)
- [ ] Scatter/chase cycle switches on the correct timer schedule
- [ ] Blinky directly pursues the player in chase mode (verify visually)
- [ ] Pinky targets ahead of the player (verify by watching it cut corners)
- [ ] Player collision in any non-frightened ghost → dying phase → life lost → respawn
- [ ] Ghost house exit: ghosts leave one by one at game start (Blinky immediately, others delayed)
- [ ] Zero TypeScript errors; ghost logic has no React/DOM imports
