"use client";

import { useState, useEffect } from "react";

function hasMatchingShape<T>(parsed: unknown, defaultValue: T): parsed is T {
  if (typeof parsed !== typeof defaultValue) return false;
  if (typeof defaultValue !== "object" || defaultValue === null) return true;
  if (parsed === null) return false;
  const def = defaultValue as Record<string, unknown>;
  const val = parsed as Record<string, unknown>;
  return Object.keys(def).every(
    (k) => k in val && typeof val[k] === typeof def[k]
  );
}

export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  // Always initialise to defaultValue so the first render matches SSR output.
  const [state, setState] = useState<T>(defaultValue);
  // `loaded` gates the persist effect so it never runs before the hydration
  // read is complete — prevents briefly overwriting localStorage with the default.
  const [loaded, setLoaded] = useState(false);

  // After mount: hydrate from localStorage then mark as loaded.
  // key and defaultValue are stable call-site constants; empty dep array is intentional.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (hasMatchingShape(parsed, defaultValue)) {
          setState(parsed);
        }
      }
    } catch {
      // storage unavailable — keep default
    }
    setLoaded(true);
  }, []); // mount-only

  // Persist on every state change, but only after the hydration read is done.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // storage full or unavailable — ignore
    }
  }, [key, state, loaded]);

  return [state, setState];
}
