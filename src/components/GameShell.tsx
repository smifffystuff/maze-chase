"use client";

import { useRef } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import { Hud } from "./Hud";
import RotateOverlay from "./RotateOverlay";

export default function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { score, lives, phase, restart } = useGameLoop(canvasRef);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
        style={{ imageRendering: "pixelated" }}
      />
      <Hud score={score} lives={lives} phase={phase} onRestart={restart} />
      <RotateOverlay />
    </div>
  );
}
