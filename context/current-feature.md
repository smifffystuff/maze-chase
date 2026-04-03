# Current Feature

## Status

Not Started

## Goals

<!-- Goals will be populated by /feature load -->

## Notes

<!-- Notes will be populated by /feature load -->

## History

### 01 — Skeleton App
Next.js 16 + React 19 + Tailwind v4 + shadcn/ui foundation. Full-viewport black canvas page, Press Start 2P font, game theme tokens, stub hooks (useGameLoop, useOrientation), scaffolded src/game/ subdirectories. Build and type-check clean.

### 02 — MVP (Playable Core)
Full game loop with no ghosts. 28×31 maze grid with walls, pellets, power-pills, ghost-spawn tiles, and a tunnel row. Pixel-based player movement with tile-centre snapping, buffered direction input, wall collision, and left/right tunnel wrap. Keyboard (arrows/WASD) and touch swipe input merged via InputManager. Canvas Renderer draws maze and animated Pac-Man. useGameLoop hook runs at 60 fps with a fixed 16 ms timestep, 1.5 s dying pause, and restart. Hud component shows score, life icons, and game-over/level-complete overlays. Build and type-check clean.

### 03 — Ghost AI
Four ghosts with distinct chase personalities: Blinky (direct pursuit), Pinky (4-tiles-ahead ambush), Inky (mirror of Blinky through 2-tile pivot), Clyde (chases when far, retreats when close). Tile-based pathfinding — at each tile centre choose exit minimising Euclidean distance to target, no mid-corridor reversals. Classic level-1 scatter/chase schedule (scatter 7s → chase 20s × 2 → scatter 5s × 2 → chase ∞). Staggered ghost-house release: Blinky immediately, others at 2/4/6 s. Player collision with non-frightened ghost → dying phase. Ghost D-shape renderer with directional eyes. `GhostMode` type includes `frightened`/`eaten` stubs for feature 04. Also fixed game-over button visibility (light-on-light). Build and type-check clean.
