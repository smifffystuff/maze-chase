"use client";

import { Button } from "@/components/ui/button";

interface GameOverOverlayProps {
  score: number;
  highScore: number;
  onRestart: () => void;
}

function padScore(n: number): string {
  return String(n).padStart(6, "0");
}

export function GameOverOverlay({ score, highScore, onRestart }: GameOverOverlayProps) {
  const isNewBest = score > 0 && score >= highScore;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto bg-black/80 gap-6 opacity-0 animate-[fadeIn_0.5s_ease-in_forwards]"
      style={{ fontFamily: "var(--font-display)" }}
    >
      <p className="text-red-500" style={{ fontSize: "18px", letterSpacing: "0.05em" }}>
        GAME OVER
      </p>

      <div className="flex flex-col items-center gap-3" style={{ fontSize: "9px" }}>
        <div className="text-center text-white">
          <div className="opacity-50 mb-1">SCORE</div>
          <div>{padScore(score)}</div>
        </div>

        <div className="text-center text-white">
          <div className="opacity-50 mb-1">HI-SCORE</div>
          <div className="flex items-center gap-2">
            {padScore(highScore)}
            {isNewBest && (
              <span
                className="text-yellow-400 border border-yellow-400 px-1"
                style={{ fontSize: "7px" }}
              >
                NEW BEST!
              </span>
            )}
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={onRestart}
        className="border-yellow-400 text-yellow-400 bg-transparent hover:bg-yellow-400 hover:text-black"
        style={{ fontFamily: "var(--font-display)", fontSize: "9px" }}
      >
        PLAY AGAIN
      </Button>
    </div>
  );
}
