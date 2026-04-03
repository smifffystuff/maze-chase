# Maze Chase Game Specification

## Overview
A mobile-first arcade maze game inspired by classic maze-chase gameplay. Built using Next.js and TypeScript, targeting mobile browsers and desktop web.

## Goals
- Smooth performance on mobile and desktop browsers
- Simple, responsive touch controls
- Classic gameplay loop with modern polish
- Landscape-first layout optimised for mobile play

## Core Gameplay
- Navigate a maze collecting pellets
- Avoid ghosts with distinct behaviors
- Collect power pills to defeat ghosts temporarily
- Clear all pellets to complete levels
- Lose lives on collision with ghosts

## Tech Stack
- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4 (styling)
- shadcn/ui 3.5 (UI components — menus, overlays, HUD elements)
- HTML5 Canvas or PixiJS (game rendering)
- Web Audio API (sound)
- Vibration API (haptics, where supported)

## Orientation Handling
- On mobile devices, the game requires landscape orientation
- Uses the Screen Orientation API (`screen.orientation.lock('landscape')`) where supported (Android Chrome, most modern mobile browsers)
- On devices/browsers that do not support orientation lock, display a full-screen "Please rotate your device" overlay when portrait mode is detected via the `orientationchange` event and `window.matchMedia('(orientation: portrait)')`
- Desktop browsers are unaffected and display the game at any viewport ratio

## Architecture
- Simulation Layer (game logic, framework-agnostic TypeScript)
- Render Layer (Canvas / PixiJS)
- Input Layer (touch gestures + keyboard)
- Persistence Layer (localStorage)

## Data Models
- Tile-based maze grid
- Entity system (player, ghosts)
- Game session state (score, lives, level)

## Controls
- Swipe gestures (primary, mobile)
- On-screen D-pad buttons (fallback, mobile)
- Keyboard arrow / WASD keys (desktop)

## Features (v1)
- Single maze
- Player movement
- Four ghost types
- Pellets + power pills
- Score + lives system
- Game over + restart
- Settings (sound / haptics)
- Local high score storage (localStorage)

## Performance
- Target 60 FPS via `requestAnimationFrame`
- Fixed timestep simulation
- Minimal React re-renders (game loop lives outside React state)

## Folder Structure
src/
  app/                  # Next.js App Router pages & layouts
  game/
    engine/             # Core simulation logic
    render/             # Canvas / PixiJS rendering
    input/              # Touch & keyboard handling
    data/               # Maze definitions, constants
    entities/           # Player, ghost, pellet logic
  components/           # React UI components (HUD, menus, overlays — built with shadcn/ui)
  hooks/                # Custom React hooks (useOrientation, useGameLoop, etc.)
  lib/                  # shadcn/ui utilities (cn helper, etc.)

## Roadmap
Phase 1: Prototype
Phase 2: Core gameplay
Phase 3: Polish & release

## Notes
- Use original assets (no Pac-Man IP)
- Keep simulation logic deterministic and testable (pure TypeScript, no React dependency)
- Orientation lock support varies by browser; always provide the rotate-device fallback overlay
- shadcn/ui is used only for non-canvas UI (menus, dialogs, settings, score overlays); the game canvas itself is unstyled
- Tailwind v4 uses CSS-first configuration (no tailwind.config.js); theme tokens defined in global CSS
