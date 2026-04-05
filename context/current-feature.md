# Current Feature

## Status

Not Started

## Goals

<!-- bullet points of what success looks like -->

## Notes

<!-- additional context, constraints, or details from spec -->

## History

### 01 — Skeleton App
Next.js 16 + React 19 + Tailwind v4 + shadcn/ui foundation. Full-viewport black canvas page, Press Start 2P font, game theme tokens, stub hooks (useGameLoop, useOrientation), scaffolded src/game/ subdirectories. Build and type-check clean.

### 02 — MVP (Playable Core)
Full game loop with no ghosts. 28×31 maze grid with walls, pellets, power-pills, ghost-spawn tiles, and a tunnel row. Pixel-based player movement with tile-centre snapping, buffered direction input, wall collision, and left/right tunnel wrap. Keyboard (arrows/WASD) and touch swipe input merged via InputManager. Canvas Renderer draws maze and animated Pac-Man. useGameLoop hook runs at 60 fps with a fixed 16 ms timestep, 1.5 s dying pause, and restart. Hud component shows score, life icons, and game-over/level-complete overlays. Build and type-check clean.

### 03 — Ghost AI
Four ghosts with distinct chase personalities: Blinky (direct pursuit), Pinky (4-tiles-ahead ambush), Inky (mirror of Blinky through 2-tile pivot), Clyde (chases when far, retreats when close). Tile-based pathfinding — at each tile centre choose exit minimising Euclidean distance to target, no mid-corridor reversals. Classic level-1 scatter/chase schedule (scatter 7s → chase 20s × 2 → scatter 5s × 2 → chase ∞). Staggered ghost-house release: Blinky immediately, others at 2/4/6 s. Player collision with non-frightened ghost → dying phase. Ghost D-shape renderer with directional eyes. `GhostMode` type includes `frightened`/`eaten` stubs for feature 04. Also fixed game-over button visibility (light-on-light). Build and type-check clean.

### 04 — Power Pills & Frightened State
Power pill collection turns all ghosts blue/frightened, reverses direction, and slows them (speed 4). Player can eat frightened ghosts for escalating combo scores (200/400/800/1600); `ghostEatCombo` resets on player death. Eaten ghosts become eyes-only and pathfind back to ghost house via corridors at speed 12. Ghosts flash blue/white in the final 2 seconds of frightened state. Frightened mode restores the correct scatter/chase phase on expiry. Score pop-ups appear at eaten ghost positions with a brief game pause (~500 ms). New engine file `powerPill.ts` with `applyPowerPill` and `tickFrightened`. Build and type-check clean.

### 05 — Orientation Handling
On mobile, attempts `screen.orientation.lock('portrait')` on mount; on success orientation is handled natively with no overlay. On failure (iOS Safari, Firefox, or absent API), subscribes to `matchMedia('(orientation: landscape)')` and shows a full-screen `RotateOverlay` with an inline SVG rotate icon (slow spin animation) and "Rotate your device to play" text. `useOrientation` hook returns `{ isLandscape: boolean }`. Wired into `GameShell` — overlay renders above canvas and HUD; `isLandscape` passed to `useGameLoop` as `paused`, stopping rAF scheduling and resuming with reset timing on un-pause. Desktop is unaffected. Build and type-check clean.

### 06 — HUD & Scoring
Complete HUD rebuild with four new components. `ScoreBar` (3-column grid: score / hi-score / level, zero-padded). `LivesDisplay` (SVG Pac-Man arc icons, max 5 shown, ×N overflow). `GameOverOverlay` (custom full-screen, no Dialog focus-trap: "GAME OVER", final score, hi-score with "NEW BEST!" badge, "PLAY AGAIN" button). `LevelCompleteOverlay` ("LEVEL COMPLETE", score, auto-advances after 3 s or manual "NEXT LEVEL" button). `Hud` rewritten as a `pointer-events-none` composition root that mounts overlays with `pointer-events-auto`. Engine: `extraLifeAwarded: boolean` added to `GameState`; extra life awarded once when score crosses 10,000 pts in `tickGame`. `useGameLoop` now returns `level`. `highScore` held in `GameShell` session state, updated on game-over phase. Build and type-check clean.

### 07 — Audio & Haptics
All sounds synthesised via Web Audio API — no audio file assets. `AudioEngine` class (`src/game/audio/audioEngine.ts`): lazy `AudioContext` init on first user gesture (keydown/pointerdown), `visibilitychange` suspend/resume, one-shot methods (`playBlip` 880 Hz/40 ms, `playPowerPill` rising 200→600 Hz sweep, `playGhostEaten` descending 600→100 Hz sweep, `playDeath` 12-step chromatic descent ~1 s, `playLevelComplete` C-major arpeggio ~1.5 s), LFO-modulated ambient loops (`startSiren`/`stopSiren` at 440 Hz/gain 0.03, `startFrightened`/`stopFrightened` at 180 Hz/gain 0.04). `enabled` getter/setter silences everything immediately when set false. `haptics` object (`src/game/audio/haptics.ts`) with `navigator.vibrate?.()` guards for pellet (10 ms), power pill, ghost eaten, and death patterns. `useGameLoop` diffs consecutive `GameState` pairs via `processAudio()` to fire events; siren restarts after dying→playing transition and on `restart()`. Build and type-check clean.

### 08 — Settings & Persistence
High score and sound/haptics preferences persisted to `localStorage` under key `maze-chase:v1`. `usePersistedState<T>` generic hook (`src/hooks/usePersistedState.ts`): SSR-safe init, try/catch around all storage access, structural type-guard validator with fallback to defaults. `useSettings` hook + `SettingsProvider` React context (`src/hooks/useSettings.ts`): exposes `soundEnabled`, `hapticsEnabled`, `highScore`, `toggleSound`, `toggleHaptics`, `updateHighScore`, `resetHighScore`; provider placed in `layout.tsx`. `highScore` moved from `GameShell` session state into `useSettings`. `useGameLoop` extended with `soundEnabled`/`hapticsEnabled` options — sound wired to `AudioEngine.enabled`, haptics guarded by ref in `processAudio`. `pauseGame`/`resumeGame` returned from `useGameLoop` and called by settings sheet open/close. `SettingsSheet` component (`src/components/SettingsSheet.tsx`): shadcn `<Sheet>` + `<Switch>` for sound and vibration toggles; haptics row hidden on desktop via `navigator.vibrate` detection; high-score display with destructive Reset button; trigger button has `pointer-events-auto`. Build and type-check clean.
