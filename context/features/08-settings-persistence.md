# 08 — Settings & Persistence

## Goal
Persist the high score and user preferences (sound, haptics) to localStorage so they survive page refreshes. Add a settings UI accessible from the main menu and in-game pause screen.

---

## localStorage Schema

Use a single namespaced key to avoid collisions:

```ts
const STORAGE_KEY = 'maze-chase:v1';

interface PersistedData {
  highScore: number;
  settings: {
    soundEnabled: boolean;
    hapticsEnabled: boolean;
  };
}
```

Always read with a try/catch (localStorage can throw in private-browsing mode or when storage is full).

---

## Hook (`src/hooks/usePersistedState.ts`)

Generic helper used by the settings store:

```ts
function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T) => void]
```

- Reads from localStorage on mount (SSR-safe: check `typeof window !== 'undefined'`)
- Writes on every update
- Validates the parsed JSON shape before using it (zod or a simple type-guard function); fall back to `defaultValue` if invalid

---

## Settings Store (`src/hooks/useSettings.ts`)

```ts
export function useSettings() {
  return {
    soundEnabled: boolean,
    hapticsEnabled: boolean,
    highScore: number,
    toggleSound: () => void,
    toggleHaptics: () => void,
    updateHighScore: (score: number) => void,
  }
}
```

Internally uses `usePersistedState` with the `STORAGE_KEY`. Expose through React context (`SettingsProvider`) so any component can read settings without prop drilling.

Place `<SettingsProvider>` in `src/app/layout.tsx`.

---

## Settings UI

### Settings Sheet (`src/components/SettingsSheet.tsx`)
Use shadcn `<Sheet>` (slide-in panel from the right or bottom).

Add a settings icon button to the HUD (top-right area, or accessible via pause). The button opens the Sheet.

Contents:
- **Sound** toggle — shadcn `<Switch>` labelled "Sound Effects"
- **Haptics** toggle — shadcn `<Switch>` labelled "Vibration" (hide on desktop where `navigator.vibrate` is undefined)
- **High Score** display with a "Reset" button (shadcn `<Button variant="destructive">`) that clears only the high score

```tsx
// src/components/SettingsSheet.tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="pointer-events-auto">
      <SettingsIcon />
    </Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader><SheetTitle>Settings</SheetTitle></SheetHeader>
    <div className="flex flex-col gap-6 mt-6">
      <SettingRow label="Sound Effects">
        <Switch checked={soundEnabled} onCheckedChange={toggleSound} />
      </SettingRow>
      {supportsHaptics && (
        <SettingRow label="Vibration">
          <Switch checked={hapticsEnabled} onCheckedChange={toggleHaptics} />
        </SettingRow>
      )}
      <SettingRow label={`High Score: ${highScore}`}>
        <Button variant="destructive" size="sm" onClick={resetHighScore}>Reset</Button>
      </SettingRow>
    </div>
  </SheetContent>
</Sheet>
```

### Pause Screen
Opening the Settings Sheet while in-game should pause the game loop. Pass a `onPause` / `onResume` callback from `useGameLoop` and call them from the Sheet's `onOpenChange`.

---

## Wiring

1. Move `highScore` state from `GameShell` (step 06 temporary) into `useSettings`
2. In `GameShell`, get `soundEnabled` and `hapticsEnabled` from `useSettings` and pass them to `useGameLoop`
3. `useGameLoop` passes `soundEnabled` to `AudioEngine.enabled` and `hapticsEnabled` to the haptics module

---

## shadcn components to add
```bash
npx shadcn@latest add sheet
npx shadcn@latest add switch
```
(Button was added in step 02/06)

---

## Acceptance Criteria
- [ ] High score survives a full page reload
- [ ] Sound and haptics toggle states survive a full page reload
- [ ] Settings Sheet opens without pausing audio mid-note (pause the game loop, not the audio context)
- [ ] Toggling sound off silences in-game audio immediately (not just from the next game)
- [ ] Toggling haptics off stops vibration immediately
- [ ] Haptics toggle is hidden on desktop
- [ ] Corrupt or missing localStorage data falls back to defaults without throwing
- [ ] Reset High Score button clears only the score, not sound/haptics settings
- [ ] Settings icon button in HUD has `pointer-events-auto` (overrides parent `pointer-events-none`)
