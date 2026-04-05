export const haptics = {
  pellet: () => navigator.vibrate?.(10),
  powerPill: () => navigator.vibrate?.([0, 50, 50]),
  ghostEaten: () => navigator.vibrate?.([30, 20, 30]),
  death: () => navigator.vibrate?.([100, 50, 100, 50, 200]),
};
