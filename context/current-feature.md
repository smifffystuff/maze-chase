# Current Feature: 01 — Skeleton App

## Status

In Progress

## Goals

- Dev server runs on `localhost:3000`
- Page is full-viewport black canvas
- Tailwind v4 theme tokens resolve (test with a temporary coloured div)
- shadcn/ui `cn()` helper importable from `@/lib/utils`
- All `src/game/` subdirectories exist (even if empty)
- TypeScript strict mode enabled, zero type errors

## Notes

Bootstrap the project so every subsequent feature has a clean, correctly configured foundation to build on. The output is a running Next.js dev server with a blank canvas page, correct tooling, and all folder scaffolding in place.

### Key setup steps:
1. Create Next.js app with TypeScript, App Router, `src/` dir, import alias `@/*`
2. Install Tailwind CSS v4 (CSS-first, no `tailwind.config.js`) — configure theme tokens in `globals.css` using `@theme`
3. Install and init shadcn/ui — components added individually per feature
4. Create folder structure: `src/game/{engine,render,input,data,entities}/`, `src/components/`, `src/hooks/`, `src/lib/`
5. Root layout: black background, "Press Start 2P" Google Font, `min-h-screen bg-black text-white` on body
6. `page.tsx` renders `<GameShell />` which holds the canvas ref and stub hooks
7. Stub hooks: `useGameLoop` returns null, `useOrientation` returns `{ isPortrait: false }`

### Theme tokens (`globals.css`):
- `--color-primary: #ffdd00`
- `--color-bg: #000000`
- `--color-wall: #1a1aff`
- `--color-ghost-frightened: #0000ff`
- `--font-display: "Press Start 2P", monospace`

## History

