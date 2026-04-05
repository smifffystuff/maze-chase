"use client";

import { createContext, useContext, ReactNode, createElement } from "react";
import { usePersistedState } from "./usePersistedState";

const STORAGE_KEY = "maze-chase:v1";

interface PersistedData {
  highScore: number;
  settings: {
    soundEnabled: boolean;
    hapticsEnabled: boolean;
  };
}

const DEFAULT_DATA: PersistedData = {
  highScore: 0,
  settings: {
    soundEnabled: true,
    hapticsEnabled: true,
  },
};

interface SettingsContextValue {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  highScore: number;
  toggleSound: () => void;
  toggleHaptics: () => void;
  updateHighScore: (score: number) => void;
  resetHighScore: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = usePersistedState<PersistedData>(
    STORAGE_KEY,
    DEFAULT_DATA
  );

  const toggleSound = () =>
    setData({
      ...data,
      settings: { ...data.settings, soundEnabled: !data.settings.soundEnabled },
    });

  const toggleHaptics = () =>
    setData({
      ...data,
      settings: {
        ...data.settings,
        hapticsEnabled: !data.settings.hapticsEnabled,
      },
    });

  const updateHighScore = (score: number) => {
    if (score > data.highScore) {
      setData({ ...data, highScore: score });
    }
  };

  const resetHighScore = () => setData({ ...data, highScore: 0 });

  return createElement(SettingsContext.Provider, {
    value: {
      soundEnabled: data.settings.soundEnabled,
      hapticsEnabled: data.settings.hapticsEnabled,
      highScore: data.highScore,
      toggleSound,
      toggleHaptics,
      updateHighScore,
      resetHighScore,
    },
    children,
  });
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
