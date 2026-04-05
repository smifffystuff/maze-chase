"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface LevelCompleteOverlayProps {
  score: number;
  onNext: () => void;
}

function padScore(n: number): string {
  return String(n).padStart(6, "0");
}

const AUTO_ADVANCE_MS = 3000;

export function LevelCompleteOverlay({ score, onNext }: LevelCompleteOverlayProps) {
  useEffect(() => {
    const id = setTimeout(onNext, AUTO_ADVANCE_MS);
    return () => clearTimeout(id);
  }, [onNext]);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto bg-black/80 gap-6"
      style={{ fontFamily: "var(--font-display)" }}
    >
      <p className="text-yellow-400" style={{ fontSize: "14px", letterSpacing: "0.05em" }}>
        LEVEL COMPLETE
      </p>

      <div className="text-center text-white" style={{ fontSize: "9px" }}>
        <div className="opacity-50 mb-1">SCORE</div>
        <div>{padScore(score)}</div>
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
