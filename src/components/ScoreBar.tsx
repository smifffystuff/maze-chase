"use client";

interface ScoreBarProps {
  score: number;
  highScore: number;
  level: number;
}

function padScore(n: number): string {
  return String(n).padStart(6, "0");
}

export function ScoreBar({ score, highScore, level }: ScoreBarProps) {
  return (
    <div
      className="absolute top-0 left-0 right-0 grid grid-cols-3 px-2 pt-1 pb-1 text-white"
      style={{ fontFamily: "var(--font-display)", fontSize: "9px", lineHeight: 1.6 }}
    >
      {/* Left — score */}
      <div>
        <div className="opacity-50">SCORE</div>
        <div>{padScore(score)}</div>
      </div>

      {/* Centre — high score */}
      <div className="text-center">
        <div className="opacity-50">HI-SCORE</div>
        <div>{padScore(highScore)}</div>
      </div>

      {/* Right — level */}
      <div className="text-right">
        <div className="opacity-50">LEVEL</div>
        <div>{String(level).padStart(2, "0")}</div>
      </div>
    </div>
  );
}
