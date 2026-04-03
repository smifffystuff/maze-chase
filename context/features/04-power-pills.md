# 04 — Power Pills & Frightened State

## Goal
Power pills temporarily flip ghost behaviour: ghosts become edible, slow down, and turn blue. The player can eat them for bonus points with an escalating score multiplier. Eaten ghosts return to the ghost house as eyes.

---

## Engine additions (`src/game/engine/`)

### `types.ts` additions
```ts
// Extend GhostState
export interface GhostState {
  // ... existing fields
  frightenedTimer: number;   // ms remaining in frightened state (0 = not frightened)
  flashingTimer: number;     // ms — ghost flashes white when about to recover
  eaten: boolean;            // true while returning to ghost house as eyes
}

// Extend GameState
export interface GameState {
  // ... existing fields
  ghostEatCombo: number;     // how many ghosts eaten in the current power-pill window (resets on pill or death)
}
```

### `constants.ts` additions
```ts
export const FRIGHTENED_DURATION = 8000;      // ms
export const FRIGHTENED_FLASH_START = 2000;   // ms before end when flashing begins
export const FRIGHTENED_SPEED = 4;            // tiles per second (slower)
export const EATEN_SPEED = 12;                // tiles per second (faster — rushing home)
export const GHOST_EAT_SCORES = [200, 400, 800, 1600]; // per ghost in a combo
```

### `powerPill.ts` (new file)
**`applyPowerPill(state: GameState): GameState`**
- Called when player collects a power-pill tile
- Sets all non-eaten ghosts to `mode = 'frightened'`, `frightenedTimer = FRIGHTENED_DURATION`
- Reverses the direction of every ghost immediately (the mode-switch reversal rule)
- Resets `ghostEatCombo` to 0
- Awards `POWER_PILL_SCORE`

**`tickFrightened(ghosts: GhostState[], dt: number): GhostState[]`**
- Decrements `frightenedTimer` for each frightened ghost
- When timer ≤ `FRIGHTENED_FLASH_START`, set `flashingTimer` (used by renderer to alternate colours)
- When timer ≤ 0, restore ghost to previous scatter/chase mode (use `modeController` to get correct current mode)

### `ghostMovement.ts` additions
Extend `tickGhost` to handle two new modes:

**`frightened` movement**
- At each tile decision point, choose a random valid exit (not reverse, not wall)
- Use `FRIGHTENED_SPEED`

**`eaten` movement (returning to ghost house)**
- Target tile: `GHOST_SPAWN_TILE`
- Use `chooseDirection` with the spawn tile as target (shortest path home)
- Use `EATEN_SPEED`
- On reaching spawn tile: set `eaten = false`, restore mode to current scatter/chase mode, re-enter ghost house release queue

### `collision.ts` additions
Extend `checkGhostCollision`:
- If ghost mode is `frightened` and player overlaps:
  - Mark ghost as `eaten = true`
  - Award `GHOST_EAT_SCORES[ghostEatCombo]` (capped at index 3)
  - Increment `ghostEatCombo`
  - Briefly freeze the game loop for ~500 ms (show score pop-up at ghost position)
- If ghost mode is `eaten`: no collision effect

---

## Render additions (`src/game/render/`)

### `renderer.ts` additions
**`drawGhost` — frightened state rendering**
- Body: deep blue (`#0000cc`) fill when frightened
- Eyes: replaced with a simple white arc "smile" shape
- Flashing: alternate between blue and white every 200 ms when `flashingTimer > 0`

**`drawGhost` — eaten state rendering**
- Body: invisible (transparent)
- Eyes only: two white circles with pupils, moving toward ghost house

**`drawScorePopup(position: Vec2, score: number)`**
- Briefly render the eaten-ghost score value (e.g. "200") at the ghost's pixel position
- Disappear after 500 ms

---

## Game Loop update (`src/game/engine/loop.ts`)
`tickGame` now:
1. Checks power-pill collection → calls `applyPowerPill` if collected
2. Calls `tickFrightened` on the ghost array
3. Uses ghost `mode` (frightened/eaten/scatter/chase) to determine movement target
4. Calls extended `checkGhostCollision`

---

## Acceptance Criteria
- [ ] Collecting a power pill turns all non-eaten ghosts blue and they slow down
- [ ] All ghosts reverse direction immediately on power-pill collection
- [ ] Player can eat a blue ghost — it turns to eyes and navigates back to the ghost house
- [ ] Eating multiple ghosts in one pill: scores double each time (200, 400, 800, 1600)
- [ ] Score pop-up appears at the eaten ghost's position for ~500 ms; game briefly pauses
- [ ] Ghosts flash blue/white in the final 2 seconds of frightened state
- [ ] After frightened ends, ghosts resume correct scatter/chase mode (not always scatter)
- [ ] Eaten ghosts pass through walls while returning to ghost house? No — they follow corridors
- [ ] Power pills disappear from the maze on collection
- [ ] `ghostEatCombo` resets when player dies, not just when a new pill is collected
