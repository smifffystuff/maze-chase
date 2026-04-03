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
