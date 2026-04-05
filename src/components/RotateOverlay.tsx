"use client";

function RotateIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Phone body */}
      <rect x="18" y="8" width="28" height="48" rx="4" stroke="white" strokeWidth="3" />
      {/* Screen */}
      <rect x="22" y="14" width="20" height="34" rx="1" fill="white" fillOpacity="0.2" />
      {/* Home button */}
      <circle cx="32" cy="52" r="2" fill="white" />
      {/* Rotation arrow */}
      <path
        d="M52 12 A22 22 0 0 1 56 32"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <polygon points="56,32 50,28 62,26" fill="white" />
    </svg>
  );
}

export function RotateOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white gap-6">
      <RotateIcon className="w-24 h-24 animate-[spin_3s_linear_infinite]" />
      <p
        className="text-center px-8"
        style={{ fontFamily: "var(--font-display)", fontSize: "11px", lineHeight: "2" }}
      >
        Rotate your device to play
      </p>
    </div>
  );
}
