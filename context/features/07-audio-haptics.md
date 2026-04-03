# 07 — Audio & Haptics

## Goal
Add game sounds using the Web Audio API (synthesised tones — no audio file assets required) and haptic feedback using the Vibration API. Both are optional and controlled by user settings (wired up in step 08).

Using synthesised audio avoids licensing issues and keeps the bundle small.

---

## Audio Design

All sounds are generated programmatically via the Web Audio API. No `.mp3` or `.wav` files.

| Event                  | Sound design                                                         |
|------------------------|----------------------------------------------------------------------|
| Pellet collect         | Short high-pitched blip (oscillator, ~880 Hz, 40 ms)               |
| Power pill collect     | Rising sweep (200 Hz → 600 Hz, 200 ms)                             |
| Ghost eaten            | Descending sweep (600 Hz → 100 Hz, 200 ms)                         |
| Player death           | Descending chromatic scale, ~1 s                                    |
| Level complete         | Ascending arpeggio, ~1.5 s                                          |
| Frightened (ambient)   | Looping low pulsing tone while any ghost is frightened              |
| Siren (ambient)        | Looping medium-pitched waver during normal chase/scatter play       |

---

## Implementation (`src/game/audio/`)

### `audioEngine.ts`
```ts
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private sirenNode: OscillatorNode | null = null;
  private frightenedNode: OscillatorNode | null = null;
  enabled: boolean = true;

  init(): void   // Lazily creates AudioContext on first call (must follow a user gesture)
  playBlip(): void
  playPowerPill(): void
  playGhostEaten(): void
  playDeath(): void
  playLevelComplete(): void
  startSiren(): void
  stopSiren(): void
  startFrightened(): void
  stopFrightened(): void
  destroy(): void
}
```

**Key Web Audio pattern** for a one-shot sound:
```ts
private playTone(freq: number, duration: number, type: OscillatorType = 'square') {
  if (!this.ctx || !this.enabled) return;
  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();
  osc.connect(gain);
  gain.connect(this.ctx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
  osc.start(this.ctx.currentTime);
  osc.stop(this.ctx.currentTime + duration);
}
```

**Ambient loops** (siren / frightened): use a looping `OscillatorNode` with an LFO modulating frequency. Keep a reference to stop/replace when mode changes.

**AudioContext lifecycle**: 
- Do not create `AudioContext` in the module root (blocked before user gesture)
- Call `init()` once from the game-start button handler or first keypress
- On page visibility change (`visibilitychange`), suspend/resume the context

### `audioEngine.ts` integration into `useGameLoop.ts`
- Create one `AudioEngine` instance per game session
- Call the appropriate method when game events occur (pellet collected, ghost eaten, phase changed)
- Pass `soundEnabled` setting into the engine's `enabled` flag

---

## Haptics (`src/game/audio/haptics.ts`)

```ts
export const haptics = {
  pellet: () => navigator.vibrate?.(10),
  powerPill: () => navigator.vibrate?.([0, 50, 50]),
  ghostEaten: () => navigator.vibrate?.([30, 20, 30]),
  death: () => navigator.vibrate?.([100, 50, 100, 50, 200]),
};
```

- Always guard with `navigator.vibrate?.()` — not available on iOS or desktop
- Gate all calls behind a `hapticsEnabled` flag (from settings)
- Keep patterns short to avoid annoying users

---

## Settings integration (preview — fully wired in step 08)
`AudioEngine` and `haptics` both accept an `enabled` flag. For now, default both to `true`. Step 08 will connect them to the settings store.

---

## Acceptance Criteria
- [ ] Pellet collection plays a short blip
- [ ] Power pill plays a rising sweep; frightened ambient tone starts
- [ ] Frightened ambient stops when all ghosts recover or are eaten
- [ ] Siren plays during normal gameplay; switches to frightened tone during power pill
- [ ] Ghost eaten plays a descending sweep and the correct score combo sound
- [ ] Player death plays the descending chromatic sequence; all ambient sounds stop during it
- [ ] Level complete plays the ascending arpeggio
- [ ] No audio plays before a user gesture (no browser autoplay policy violations)
- [ ] Vibration fires on pellet (10 ms), death (pattern), and ghost eaten — verify on Android Chrome
- [ ] All audio stops/suspends when the browser tab is hidden
- [ ] Setting `audioEngine.enabled = false` silences everything immediately
