# 09 — Polish

## Goal
Visual and audio refinements that elevate the game from functional to enjoyable. No new gameplay mechanics — this step improves what is already there.

---

## Player Animation

### Death animation
When `phase === 'dying'`:
- Freeze ghost movement
- Play a multi-frame death sequence on the player over ~1.5 s:
  - Frame 0–8: mouth opens to 360° (player "closes" into a pie wedge then disappears)
  - Implemented as a renderer-level animation driven by elapsed time, not game state
- After animation completes, trigger the life decrement and respawn

---

## Ghost Animations

### Eye direction
Ghost pupils already follow travel direction (step 03). Ensure the pupils smoothly interpolate when direction changes rather than snapping.

### Ghost house bounce
While ghosts are waiting in the ghost house before release, animate them bobbing gently up and down (±4 px, ~1 Hz sine wave) using a per-ghost phase offset so they don't all move in sync.

---

## Maze Rendering

### Wall style
Replace plain filled rectangles with a proper bordered wall style:
- Draw wall interiors in dark blue
- Add a bright blue outline on the inner edge of each wall tile (1–2 px)
- Rounded corners where walls meet (check adjacent tile types and apply `arcTo` at corners)

### Pellet pulse
Small pellets slightly pulse in brightness (subtle opacity oscillation, ~0.5 Hz). Power pills pulse more dramatically in size (scale ±10%).

### Level-complete flash
When the level is complete, flash the maze walls between blue and white 3× before showing the overlay.

---

## Screen Transitions

### Level start
Brief countdown "3 – 2 – 1 – GO!" rendered on the canvas (not in the DOM) before the game loop starts accepting input. Block input during countdown. Ghosts are visible but frozen.

### Game over
The game-over overlay (step 06) fades in rather than appearing immediately. Use a CSS opacity transition (`transition-opacity duration-500`).

### Score tally (level complete)
Step 06 auto-advances after 3 s. Enhance this: briefly show a score breakdown tally (pellets collected, ghosts eaten this level, bonus) before advancing.

---

## Visual Details

### Score pop-up polish (ghost eaten)
The score number (200/400/800/1600) renders at the eaten ghost's position. Add a brief upward float animation over 500 ms before disappearing.

### Bonus fruit (optional stretch goal)
After a set number of pellets are eaten (70 and 170), spawn a bonus fruit item in the centre of the maze for 10 seconds. Award 100–5000 points on collection. Simple coloured shape (no IP-infringing graphics). Implement only if time allows — mark as stretch.

---

## Performance Checks
After all polish is in place, profile in Chrome DevTools:
- Confirm steady 60 FPS on a mid-range Android device (use throttling in DevTools)
- Canvas draw calls per frame should remain under ~50
- No layout thrash from HUD updates (HUD is `pointer-events-none`, updates only on score/lives change)
- Confirm `useGameLoop` causes zero React re-renders during active play except for score/lives changes

---

## Acceptance Criteria
- [ ] Player chomps smoothly; mouth faces the direction of travel
- [ ] Death animation plays fully before life is decremented
- [ ] Ghosts bob in the ghost house with per-ghost offsets
- [ ] Maze walls have inner border highlights and rounded corners
- [ ] Pellets pulse subtly; power pills pulse more dramatically
- [ ] Level-complete flash plays before overlay appears
- [ ] Level-start countdown blocks input; ghosts are frozen
- [ ] Game-over overlay fades in
- [ ] Ghost-eaten score pop-up floats upward and fades
- [ ] 60 FPS maintained on mid-range mobile (Chrome DevTools throttled)
- [ ] No unintended React re-renders during active gameplay
