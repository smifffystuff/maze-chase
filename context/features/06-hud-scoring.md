# 06 — HUD & Scoring

## Goal
A complete, styled heads-up display showing score, high score, lives, and level. Includes the level-complete transition and game-over screen built with shadcn/ui components.

---

## Scoring Rules

| Event                        | Points                                 |
|------------------------------|----------------------------------------|
| Pellet                       | 10                                     |
| Power pill                   | 50                                     |
| Ghost (1st in combo)         | 200                                    |
| Ghost (2nd in combo)         | 400                                    |
| Ghost (3rd in combo)         | 800                                    |
| Ghost (4th in combo)         | 1,600                                  |
| Extra life                   | Awarded at 10,000 points (once only)   |

Add `extraLifeAwarded: boolean` to `GameState` and check in `tickGame`: if score crosses 10,000 and `extraLifeAwarded` is false, increment `lives` and set the flag.

---

## HUD Layout

The HUD is a React layer positioned absolutely over the canvas. It must not interfere with canvas touch events (`pointer-events-none` on the container; only interactive elements like buttons opt back in).

**Portrait layout (the normal state):**
```
┌─────────────────────┐
│  SCORE    HI-SCORE  │
│  004200   012600    │
│           LEVEL 03  │
│                     │
│  [canvas game area] │
│                     │
│  ♥ ♥ ♥              │
└─────────────────────┘
```

- Top bar: score (left), high score (centre), level (right)
- Bottom-left: lives as small player-character icons (SVG or Canvas-drawn, not emoji)
- All text uses the "Press Start 2P" display font
- Numbers animate up when they change (CSS counter animation or framer-motion number roll — keep it lightweight)

---

## Components

### `src/components/Hud.tsx`
Props:
```ts
interface HudProps {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  phase: GameState['phase'];
  onRestart: () => void;
}
```

Renders:
- `<ScoreBar>` — top strip
- `<LivesDisplay>` — bottom-left icons
- `<GameOverOverlay>` or `<LevelCompleteOverlay>` conditionally based on `phase`

### `src/components/ScoreBar.tsx`
Thin top bar with three columns. Use Tailwind grid (`grid grid-cols-3`). Labels in small dim text above the values.

### `src/components/LivesDisplay.tsx`
Renders `lives` copies of a small player icon (yellow arc SVG). Max display is 5; show `×N` if more than 5 (unlikely but safe).

### `src/components/GameOverOverlay.tsx`
Uses shadcn `<Dialog>` or a custom full-screen overlay (prefer the custom overlay to avoid Dialog's focus-trap interfering with game input).

Content:
- "GAME OVER" heading (large, display font)
- Final score
- High score (with "NEW BEST!" badge if beaten)
- "PLAY AGAIN" button (shadcn `<Button variant="default">`)

### `src/components/LevelCompleteOverlay.tsx`
Content:
- "LEVEL COMPLETE" heading
- Score tally (brief delay, then auto-advance to next level after 3 s, or a "NEXT LEVEL" button)

---

## High Score (temporary, before 08-settings-persistence)
For now, keep the high score in React state (`useState`) within `GameShell`. It will be moved to localStorage in step 08. Pass it down to `Hud`.

```ts
const [highScore, setHighScore] = useState(0);
// after game over:
setHighScore(prev => Math.max(prev, score));
```

---

## useGameLoop additions
The hook already returns `score`, `lives`, `phase`. Add:
- `level: number`

---

## Acceptance Criteria
- [ ] Score displays and updates in real time during gameplay
- [ ] High score persists across restarts within the same session (upgrades to localStorage in step 08)
- [ ] Lives show as icons; losing a life removes one icon
- [ ] Reaching 10,000 pts awards an extra life (once per game)
- [ ] Game-over overlay shows with final score, high score, and play-again button
- [ ] Level-complete overlay shows and auto-advances (or manual advance) after a delay
- [ ] HUD has `pointer-events-none` so it never blocks canvas touch input
- [ ] Display font ("Press Start 2P") renders on all elements
