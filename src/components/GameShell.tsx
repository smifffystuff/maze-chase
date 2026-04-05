"use client";

import { useRef } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useOrientation } from "@/hooks/useOrientation";
import { Hud } from "./Hud";
import { RotateOverlay } from "./RotateOverlay";

export default function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isLandscape } = useOrientation();
  const { score, lives, phase, restart } = useGameLoop(canvasRef, isLandscape);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
        style={{ imageRendering: "pixelated", touchAction: "none" }}
      />
      <Hud score={score} lives={lives} phase={phase} onRestart={restart} />
      {isLandscape && <RotateOverlay />}
    </div>
  );
}
