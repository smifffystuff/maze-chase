import { Direction } from '../engine/types';

const KEY_MAP: Record<string, Direction> = {
  ArrowUp:    'up',
  ArrowDown:  'down',
  ArrowLeft:  'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

export interface InputSource {
  getDirection(): Direction;
  destroy(): void;
}

export function createKeyboardInput(): InputSource {
  let current: Direction = 'none';

  function onKeyDown(e: KeyboardEvent) {
    const dir = KEY_MAP[e.key];
    if (dir) {
      e.preventDefault();
      current = dir;
    }
  }

  window.addEventListener('keydown', onKeyDown);

  return {
    getDirection: () => current,
    destroy: () => window.removeEventListener('keydown', onKeyDown),
  };
}
