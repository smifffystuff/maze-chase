"use client";

import { useState, useEffect } from "react";

export function useOrientation(): { isLandscape: boolean } {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const isMobile = navigator.maxTouchPoints > 0;
    if (!isMobile) return;

    let mqCleanup: (() => void) | undefined;
    let lockAcquired = false;

    const orientationWithLock = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };

    const useOverlay = () => {
      const mq = window.matchMedia("(orientation: landscape)");
      const handler = (e: MediaQueryListEvent) => setIsLandscape(e.matches);
      setIsLandscape(mq.matches);
      mq.addEventListener("change", handler);
      mqCleanup = () => mq.removeEventListener("change", handler);
    };

    if (typeof orientationWithLock.lock === "function") {
      orientationWithLock
        .lock("portrait")
        .then(() => {
          lockAcquired = true;
        })
        .catch(useOverlay);
    } else {
      useOverlay();
    }

    return () => {
      mqCleanup?.();
      if (lockAcquired) {
        screen.orientation.unlock();
      }
    };
  }, []);

  return { isLandscape };
}
