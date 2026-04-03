"use client";

import { useOrientation } from "@/hooks/useOrientation";

export default function RotateOverlay() {
  const { isPortrait } = useOrientation();

  if (!isPortrait) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black text-white text-center p-8">
      <p>Please rotate your device to landscape mode to play.</p>
    </div>
  );
}
