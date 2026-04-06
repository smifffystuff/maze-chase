"use client";

import { GameState } from "@/game/engine/types";
import { ScoreBar } from "./ScoreBar";
import { LivesDisplay } from "./LivesDisplay";
import { GameOverOverlay } from "./GameOverOverlay";
import { LevelCompleteOverlay } from "./LevelCompleteOverlay";
import { SettingsSheet } from "./SettingsSheet";

export interface HudProps {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  phase: GameState["phase"];
  pelletsEaten: number;
  ghostsEaten: number;
  onRestart: () => void;
  onSettingsOpen: () => void;
  onSettingsClose: () => void;
}

export function Hud({
  score,
  highScore,
  lives,
  level,
  phase,
  pelletsEaten,
  ghostsEaten,
  onRestart,
  onSettingsOpen,
  onSettingsClose,
}: HudProps) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      <ScoreBar score={score} highScore={highScore} level={level} />
      <LivesDisplay lives={lives} />

      <div className="absolute top-2 right-2">
        <SettingsSheet onPause={onSettingsOpen} onResume={onSettingsClose} />
      </div>

      {phase === "game-over" && (
        <GameOverOverlay score={score} highScore={highScore} onRestart={onRestart} />
      )}
      {phase === "level-complete" && (
        <LevelCompleteOverlay score={score} pelletsEaten={pelletsEaten} ghostsEaten={ghostsEaten} onNext={onRestart} />
      )}
    </div>
  );
}
