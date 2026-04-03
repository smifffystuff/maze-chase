"use client";

import { Button } from "@/components/ui/button";
import { GameState } from "@/game/engine/types";

interface HudProps {
  score: number;
  lives: number;
  phase: GameState["phase"];
  onRestart: () => void;
}

function LifeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <circle cx="7" cy="7" r="6" fill="#ffdd00" />
    </svg>
  );
}

export function Hud({ score, lives, phase, onRestart }: HudProps) {
  const showOverlay = phase === "game-over" || phase === "level-complete";

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none"
      style={{ fontFamily: "var(--font-display)", fontSize: "10px" }}
    >
      {/* Score — top left */}
      <div className="absolute top-2 left-2 text-white leading-relaxed">
        <div className="opacity-60">SCORE</div>
        <div>{score}</div>
      </div>

      {/* Lives — top right */}
      <div className="absolute top-2 right-2 flex gap-1 items-center">
        {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
          <LifeIcon key={i} />
        ))}
      </div>

      {/* Game-over / level-complete overlay */}
      {showOverlay && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto bg-black/75 gap-4">
          <p
            className="text-yellow-400"
            style={{ fontSize: "14px", letterSpacing: "0.1em" }}
          >
            {phase === "game-over" ? "GAME OVER" : "LEVEL COMPLETE"}
          </p>
          <Button
            variant="outline"
            onClick={onRestart}
            style={{ fontFamily: "var(--font-display)", fontSize: "10px" }}
          >
            RESTART
          </Button>
        </div>
      )}
    </div>
  );
}
