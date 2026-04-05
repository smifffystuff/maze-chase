"use client";

import { useState, useEffect } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/useSettings";

interface SettingsSheetProps {
  onPause: () => void;
  onResume: () => void;
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

export function SettingsSheet({ onPause, onResume }: SettingsSheetProps) {
  const {
    soundEnabled,
    hapticsEnabled,
    highScore,
    toggleSound,
    toggleHaptics,
    resetHighScore,
  } = useSettings();

  const [supportsHaptics, setSupportsHaptics] = useState(false);

  useEffect(() => {
    setSupportsHaptics(typeof navigator !== "undefined" && "vibrate" in navigator);
  }, []);

  return (
    <Sheet
      onOpenChange={(open) => {
        if (open) onPause();
        else onResume();
      }}
    >
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="pointer-events-auto text-white hover:text-white hover:bg-white/10"
            aria-label="Settings"
          />
        }
      >
        <Settings2 className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="font-[family-name:var(--font-press-start-2p)]">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 p-4 mt-2">
          <SettingRow label="Sound Effects">
            <Switch
              checked={soundEnabled}
              onCheckedChange={toggleSound}
            />
          </SettingRow>
          {supportsHaptics && (
            <SettingRow label="Vibration">
              <Switch
                checked={hapticsEnabled}
                onCheckedChange={toggleHaptics}
              />
            </SettingRow>
          )}
          <SettingRow label={`Hi: ${highScore}`}>
            <Button variant="destructive" size="sm" onClick={resetHighScore}>
              Reset
            </Button>
          </SettingRow>
        </div>
      </SheetContent>
    </Sheet>
  );
}
