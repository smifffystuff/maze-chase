"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { MAZE_LEVEL_1 } from "@/game/data/maze";
import { GameState } from "@/game/engine/types";
import { createInitialState } from "@/game/engine/state";
import { tickGame } from "@/game/engine/loop";
import { createInputManager, InputManager } from "@/game/input/inputManager";
import { Renderer } from "@/game/render/renderer";

const FIXED_DT = 1 / 60; // seconds per simulation step (~16.67 ms)
const DYING_PAUSE_MS = 1500;

export interface GameLoopHandle {
  score: number;
  lives: number;
  phase: GameState["phase"];
  restart: () => void;
}

export function useGameLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>
): GameLoopHandle {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [phase, setPhase] = useState<GameState["phase"]>("playing");

  const stateRef = useRef<GameState>(createInitialState());
  const rendererRef = useRef<Renderer | null>(null);
  const inputRef = useRef<InputManager | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(-1);
  const accumRef = useRef<number>(0);
  const dyingElapsedRef = useRef<number>(0);

  const syncReact = useCallback((s: GameState) => {
    setScore(s.score);
    setLives(s.lives);
    setPhase(s.phase);
  }, []);

  const loop = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      const input = inputRef.current;
      if (!canvas || !renderer || !input) return;

      if (lastTimeRef.current < 0) lastTimeRef.current = timestamp;

      const rawDt = (timestamp - lastTimeRef.current) / 1000; // seconds
      const dt = Math.min(rawDt, 0.1); // cap to avoid spiral of death
      lastTimeRef.current = timestamp;

      const state = stateRef.current;

      // ── Dying phase: pause then reset ──
      if (state.phase === "dying") {
        dyingElapsedRef.current += dt * 1000; // track in ms

        renderer.clear();
        renderer.drawMaze(MAZE_LEVEL_1, state.pellets, state.powerPills);
        renderer.drawPlayer(state.player);

        if (dyingElapsedRef.current >= DYING_PAUSE_MS) {
          dyingElapsedRef.current = 0;
          const newLives = state.lives - 1;
          const newPhase: GameState["phase"] =
            newLives <= 0 ? "game-over" : "playing";
          const fresh = createInitialState();
          stateRef.current = {
            ...state,
            lives: newLives,
            phase: newPhase,
            player: fresh.player,
          };
          syncReact(stateRef.current);
          if (newPhase === "game-over") {
            rafRef.current = requestAnimationFrame(loop);
            return;
          }
        }

        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── Terminal phases: render once and stop ──
      if (state.phase === "game-over" || state.phase === "level-complete") {
        renderer.clear();
        renderer.drawMaze(MAZE_LEVEL_1, state.pellets, state.powerPills);
        renderer.drawPlayer(state.player);
        syncReact(state);
        return; // no further rAF — loop is stopped
      }

      // ── Normal playing ──
      // Apply buffered input direction into nextDirection
      const dir = input.getDirection();
      if (dir !== "none") {
        stateRef.current = {
          ...stateRef.current,
          player: { ...stateRef.current.player, nextDirection: dir },
        };
      }

      // Fixed-timestep simulation
      accumRef.current += dt;
      while (accumRef.current >= FIXED_DT) {
        stateRef.current = tickGame(stateRef.current, FIXED_DT, MAZE_LEVEL_1);
        accumRef.current -= FIXED_DT;
        if (stateRef.current.phase !== "playing") break;
      }

      renderer.clear();
      renderer.drawMaze(
        MAZE_LEVEL_1,
        stateRef.current.pellets,
        stateRef.current.powerPills
      );
      renderer.drawPlayer(stateRef.current.player);

      syncReact(stateRef.current);

      rafRef.current = requestAnimationFrame(loop);
    },
    [canvasRef, syncReact]
  );

  const start = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lastTimeRef.current = -1;
    accumRef.current = 0;
    dyingElapsedRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const restart = useCallback(() => {
    stateRef.current = createInitialState();
    syncReact(stateRef.current);
    start();
  }, [start, syncReact]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    rendererRef.current = new Renderer(canvas);
    inputRef.current = createInputManager(canvas.parentElement ?? document.body);
    start();

    function onResize() {
      rendererRef.current?.scaleToFit(canvas!);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      inputRef.current?.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [canvasRef, start]);

  return { score, lives, phase, restart };
}
