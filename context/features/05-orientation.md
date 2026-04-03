# 05 — Orientation Handling

## Goal
On mobile, force landscape orientation using the Screen Orientation API where available. Where it is not (iOS Safari, Firefox), show a full-screen "please rotate" overlay when portrait is detected. Desktop is unaffected.

---

## Hook (`src/hooks/useOrientation.ts`)

```ts
export function useOrientation(): { isPortrait: boolean } 
```

**Logic:**
1. On mount, detect if the device is likely mobile (`navigator.maxTouchPoints > 0` or user-agent check — prefer `maxTouchPoints`)
2. If mobile, attempt `screen.orientation.lock('landscape')`:
   - If it resolves: orientation is handled natively, no overlay needed
   - If it rejects (or `screen.orientation.lock` doesn't exist): fall through to overlay mode
3. In overlay mode, subscribe to `window.matchMedia('(orientation: portrait)')` for live changes
4. Return `{ isPortrait: true }` when in overlay mode and portrait is detected; `false` otherwise
5. On unmount, call `screen.orientation.unlock()` if lock was acquired, and remove media query listener

```ts
// Rough implementation shape
const [isPortrait, setIsPortrait] = useState(false);

useEffect(() => {
  const isMobile = navigator.maxTouchPoints > 0;
  if (!isMobile) return;

  const tryLock = async () => {
    try {
      await screen.orientation.lock('landscape');
    } catch {
      // Lock not supported — use overlay fallback
      const mq = window.matchMedia('(orientation: portrait)');
      const handler = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
      setIsPortrait(mq.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  };

  const cleanup = tryLock();
  return () => { cleanup.then(fn => fn?.()); };
}, []);
```

---

## Component (`src/components/RotateOverlay.tsx`)

Rendered in `GameShell.tsx` on top of the canvas when `isPortrait === true`.

**Design requirements:**
- Full-viewport fixed overlay (`position: fixed; inset: 0`)
- Black background (`bg-black`)
- Centred icon (a phone-rotation SVG or simple CSS illustration)
- Text: "Rotate your device to play"
- Must sit above the canvas and all other UI (`z-index` higher than HUD)
- No game input should be possible while visible (overlay intercepts all touch events)

**Implementation:**
```tsx
// src/components/RotateOverlay.tsx
export function RotateOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white gap-6">
      <RotateIcon className="w-24 h-24 animate-spin-slow" />
      <p className="font-display text-sm text-center px-8">
        Rotate your device to play
      </p>
    </div>
  );
}
```

Use a simple inline SVG for the rotate icon to avoid external asset dependency. A slow rotation CSS animation (`animate-[spin_3s_linear_infinite]`) communicates the required action.

---

## Wiring in `GameShell.tsx`

```tsx
const { isPortrait } = useOrientation();

return (
  <div className="relative w-screen h-screen bg-black overflow-hidden">
    <canvas ref={canvasRef} className="w-full h-full" />
    <Hud ... />
    {isPortrait && <RotateOverlay />}
  </div>
);
```

The game loop should pause when `isPortrait` is true (pass it into `useGameLoop` and skip `requestAnimationFrame` scheduling while paused).

---

## Notes
- `screen.orientation.lock` requires a user gesture on some browsers — call it from a tap/button handler on the start screen rather than silently on mount if it fails without a gesture
- Do not attempt the lock on desktop (wastes the rejection and may log console errors)
- iOS Safari does not support `screen.orientation.lock` as of 2025 — the overlay is the only mechanism for iOS users

---

## Acceptance Criteria
- [ ] On Android Chrome: orientation locks to landscape automatically; overlay never appears
- [ ] On iOS Safari (simulated): overlay appears in portrait, disappears on rotate
- [ ] On desktop: neither lock nor overlay activates regardless of window shape
- [ ] Overlay covers the full screen and blocks all touch input
- [ ] Game loop pauses while overlay is visible and resumes on hide
- [ ] No console errors on browsers that don't support `screen.orientation.lock`
