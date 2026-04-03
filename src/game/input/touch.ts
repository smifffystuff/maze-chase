import { Direction } from '../engine/types';
import { InputSource } from './keyboard';

const SWIPE_THRESHOLD = 20; // px

export function createTouchInput(element: HTMLElement): InputSource {
  let current: Direction = 'none';
  let startX = 0;
  let startY = 0;

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
  }

  function onTouchEnd(e: TouchEvent) {
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      current = dx > 0 ? 'right' : 'left';
    } else {
      current = dy > 0 ? 'down' : 'up';
    }
  }

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchend', onTouchEnd, { passive: true });

  return {
    getDirection: () => current,
    destroy: () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchend', onTouchEnd);
    },
  };
}
