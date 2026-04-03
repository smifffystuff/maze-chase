import { GhostMode } from './types';

// Classic Pac-Man level-1 scatter/chase schedule (durations in ms)
const MODE_SCHEDULE: { mode: GhostMode; duration: number }[] = [
  { mode: 'scatter', duration: 7000 },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 7000 },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 5000 },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 5000 },
  { mode: 'chase',   duration: Infinity },
];

// Returns the ghost mode for the given elapsed game time (ms).
// Pure function — no side effects.
export function tickModeController(elapsed: number): GhostMode {
  let remaining = elapsed;
  for (const phase of MODE_SCHEDULE) {
    if (remaining < phase.duration) return phase.mode;
    remaining -= phase.duration;
  }
  return 'chase';
}
