"use client";

import { useEffect, useRef } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useOrientation } from "@/hooks/useOrientation";
import { useSettings } from "@/hooks/useSettings";
import { Hud } from "./Hud";
import { RotateOverlay } from "./RotateOverlay";

export default function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isLandscape } = useOrientation();
  const { highScore, updateHighScore, soundEnabled, hapticsEnabled } = useSettings();
  const { score, lives, level, phase, pelletsEaten, ghostsEaten, restart, pauseGame, resumeGame } = useGameLoop(
    canvasRef,
    { paused: isLandscape, soundEnabled, hapticsEnabled }
  );

  useEffect(() => {
    if (phase === "game-over") {
      updateHighScore(score);
    }
  }, [phase, score, updateHighScore]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
        style={{ imageRendering: "pixelated", touchAction: "none" }}
      />
      <Hud
        score={score}
        highScore={highScore}
        lives={lives}
        level={level}
        phase={phase}
        pelletsEaten={pelletsEaten}
        ghostsEaten={ghostsEaten}
        onRestart={restart}
        onSettingsOpen={pauseGame}
        onSettingsClose={resumeGame}
      />
      {isLandscape && <RotateOverlay />}
    </div>
  );
}
