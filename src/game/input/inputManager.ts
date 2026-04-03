import { Direction } from '../engine/types';
import { createKeyboardInput, InputSource } from './keyboard';
import { createTouchInput } from './touch';

export interface InputManager {
  getDirection(): Direction;
  destroy(): void;
}

export function createInputManager(element: HTMLElement): InputManager {
  const keyboard = createKeyboardInput();
  const touch = createTouchInput(element);

  return {
    // Keyboard takes priority; fall back to touch
    getDirection(): Direction {
      const kb = keyboard.getDirection();
      return kb !== 'none' ? kb : touch.getDirection();
    },
    destroy() {
      keyboard.destroy();
      touch.destroy();
    },
  };
}
