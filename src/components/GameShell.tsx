"use client";

import { useRef } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import RotateOverlay from "./RotateOverlay";

export default function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useGameLoop(canvasRef);

  return (
    <div className="relative w-full h-screen bg-black">
      <canvas ref={canvasRef} className="w-full h-full" />
      <RotateOverlay />
    </div>
  );
}
