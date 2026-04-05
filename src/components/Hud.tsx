"use client";

import { GameState } from "@/game/engine/types";
import { ScoreBar } from "./ScoreBar";
import { LivesDisplay } from "./LivesDisplay";
import { GameOverOverlay } from "./GameOverOverlay";
import { LevelCompleteOverlay } from "./LevelCompleteOverlay";

export interface HudProps {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  phase: GameState["phase"];
  onRestart: () => void;
}

export function Hud({ score, highScore, lives, level, phase, onRestart }: HudProps) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      <ScoreBar score={score} highScore={highScore} level={level} />
      <LivesDisplay lives={lives} />

      {phase === "game-over" && (
        <GameOverOverlay score={score} highScore={highScore} onRestart={onRestart} />
      )}
      {phase === "level-complete" && (
        <LevelCompleteOverlay score={score} onNext={onRestart} />
      )}
    </div>
  );
}
