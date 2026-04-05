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
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      const parsed = JSON.parse(raw) as unknown;
      return hasMatchingShape(parsed, defaultValue) ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // storage full or unavailable — ignore
    }
  }, [key, state]);

  return [state, setState];
}
