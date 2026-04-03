# Current Feature: 02 — MVP (Playable Core)

## Status

In Progress

## Goals

- Maze grid data defined as 28×31 `TileType[][]` with `MAZE_LEVEL_1` export
- Game constants in `src/game/data/constants.ts`
- Engine types (`Direction`, `Vec2`, `GameState`, `PlayerState`) in `src/game/engine/types.ts`
- `createInitialState()` builds fresh state from maze data
- `tickPlayer` handles pixel-based movement, tile snapping, wall collision, and tunnel wrap
- `checkPelletCollection` removes pellets on collection, triggers `level-complete` when all cleared
- `tickGame` composes movement + collision into a single immutable state update
- Keyboard input (arrows + WASD) via `createKeyboardInput()`
- Touch/swipe input (20 px threshold) via `createTouchInput()`
- `InputManager` merges both inputs, keyboard takes priority
- `Renderer` class draws maze (walls, corridors, pellets, power pills) and animated player (Pac-Man mouth)
- `useGameLoop` hook wires Renderer + InputManager + game state into a 60 FPS rAF loop
- `Hud.tsx` component shows score, lives, and game-over/level-complete overlays
- `GameShell.tsx` wired up with canvas + HUD

## Notes

- Ghosts, power pills (gameplay), and audio are **out of scope**
- Game engine (`src/game/`) must have **zero imports from React or browser DOM APIs**
- State updates must be **immutable** (always return new objects)
- Fixed timestep: 16 ms increments; accumulate dt and step multiple times per frame if needed
- On `dying` phase: decrement lives, reset player position after 1.5 s pause
- Power-pill tiles exist in the maze and are rendered, but their gameplay effect is deferred to a later feature
- Use `--color-wall` CSS token for wall colour in renderer
- Lives displayed as small player-circle icons in the HUD (top-right)
- Restart button uses shadcn `<Button>`

## History

### 01 — Skeleton App
Next.js 16 + React 19 + Tailwind v4 + shadcn/ui foundation. Full-viewport black canvas page, Press Start 2P font, game theme tokens, stub hooks (useGameLoop, useOrientation), scaffolded src/game/ subdirectories. Build and type-check clean.
