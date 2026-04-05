"use client";

const MAX_ICON_DISPLAY = 5;

function PlayerIcon() {
  // Small yellow Pac-Man arc (open mouth pointing right)
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <path
        d="M6 6 L10.5 2.5 A5.5 5.5 0 1 0 10.5 9.5 Z"
        fill="#ffdd00"
      />
    </svg>
  );
}

interface LivesDisplayProps {
  lives: number;
}

export function LivesDisplay({ lives }: LivesDisplayProps) {
  const clamped = Math.max(0, lives);
  const showOverflow = clamped > MAX_ICON_DISPLAY;
  const iconCount = showOverflow ? MAX_ICON_DISPLAY : clamped;

  return (
    <div
      className="absolute bottom-2 left-2 flex items-center gap-1"
      style={{ fontFamily: "var(--font-display)", fontSize: "9px", color: "#ffdd00" }}
    >
      {Array.from({ length: iconCount }).map((_, i) => (
        <PlayerIcon key={i} />
      ))}
      {showOverflow && <span>×{clamped}</span>}
    </div>
  );
}
