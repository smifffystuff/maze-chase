"use client";

import { useEffect, useRef, useState } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useOrientation } from "@/hooks/useOrientation";
import { Hud } from "./Hud";
import { RotateOverlay } from "./RotateOverlay";

export default function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isLandscape } = useOrientation();
  const { score, lives, level, phase, restart } = useGameLoop(canvasRef, isLandscape);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    if (phase === "game-over") {
      setHighScore(prev => Math.max(prev, score));
    }
  }, [phase, score]);

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
        onRestart={restart}
      />
      {isLandscape && <RotateOverlay />}
    </div>
  );
}
