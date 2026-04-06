"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface LevelCompleteOverlayProps {
  score: number;
  pelletsEaten: number;
  ghostsEaten: number;
  onNext: () => void;
}

function padScore(n: number): string {
  return String(n).padStart(6, "0");
}

const AUTO_ADVANCE_MS = 5000; // extended to give tally time to read

export function LevelCompleteOverlay({ score, pelletsEaten, ghostsEaten, onNext }: LevelCompleteOverlayProps) {
  useEffect(() => {
    const id = setTimeout(onNext, AUTO_ADVANCE_MS);
    return () => clearTimeout(id);
  }, [onNext]);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto bg-black/80 gap-5"
      style={{ fontFamily: "var(--font-display)" }}
    >
      <p className="text-yellow-400" style={{ fontSize: "14px", letterSpacing: "0.05em" }}>
        LEVEL COMPLETE
      </p>

      {/* Score breakdown tally */}
      <div className="flex flex-col items-center gap-2 border border-yellow-400/30 px-6 py-3" style={{ fontSize: "8px" }}>
        <div className="flex justify-between gap-8 text-white">
          <span className="opacity-50">PELLETS</span>
          <span>{pelletsEaten} × 10</span>
          <span className="text-yellow-300">{padScore(pelletsEaten * 10)}</span>
        </div>
        <div className="flex justify-between gap-8 text-white">
          <span className="opacity-50">GHOSTS</span>
          <span>{ghostsEaten} eaten</span>
          <span className="text-yellow-300">BONUS</span>
        </div>
        <div className="h-px w-full bg-yellow-400/30 my-1" />
        <div className="flex justify-between gap-8 text-white">
          <span className="opacity-50">TOTAL</span>
          <span>{padScore(score)}</span>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={onNext}
        className="border-yellow-400 text-yellow-400 bg-transparent hover:bg-yellow-400 hover:text-black"
        style={{ fontFamily: "var(--font-display)", fontSize: "9px" }}
      >
        NEXT LEVEL
      </Button>
    </div>
  );
}
