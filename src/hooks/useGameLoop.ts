"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { MAZE_LEVEL_1 } from "@/game/data/maze";
import { GameState } from "@/game/engine/types";
import { createInitialState, resetPlayer } from "@/game/engine/state";
import { tickGame } from "@/game/engine/loop";
import { createInputManager, InputManager } from "@/game/input/inputManager";
import { Renderer } from "@/game/render/renderer";
import { AudioEngine } from "@/game/audio/audioEngine";
import { haptics } from "@/game/audio/haptics";

const FIXED_DT = 1 / 60; // seconds per simulation step (~16.67 ms)
const DYING_PAUSE_MS = 1500;

export interface GameLoopHandle {
  score: number;
  lives: number;
  level: number;
  phase: GameState["phase"];
  restart: () => void;
}

export function useGameLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  paused = false
): GameLoopHandle {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<GameState["phase"]>("playing");

  const stateRef = useRef<GameState>(createInitialState());
  const rendererRef = useRef<Renderer | null>(null);
  const inputRef = useRef<InputManager | null>(null);
  const audioRef = useRef<AudioEngine>(new AudioEngine());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(-1);
  const accumRef = useRef<number>(0);
  const dyingElapsedRef = useRef<number>(0);
  const pausedRef = useRef(paused);

  const syncReact = useCallback((s: GameState) => {
    setScore(s.score);
    setLives(s.lives);
    setLevel(s.level);
    setPhase(s.phase);
  }, []);

  // Detect game events by diffing states and fire audio/haptics
  const processAudio = useCallback((prev: GameState, next: GameState) => {
    const engine = audioRef.current;

    // Pellet collected (not a power pill)
    if (next.pellets.size < prev.pellets.size && next.powerPills.size === prev.powerPills.size) {
      engine.playBlip();
      haptics.pellet();
    }

    // Power pill collected
    if (next.powerPills.size < prev.powerPills.size) {
      engine.playPowerPill();
      engine.stopSiren();
      engine.startFrightened();
    }

    // Ghost newly eaten
    const newlyEaten = next.ghosts.some((g, i) => g.mode === 'eaten' && prev.ghosts[i]?.mode !== 'eaten');
    if (newlyEaten) {
      engine.playGhostEaten();
      haptics.ghostEaten();
    }

    // All frightened ghosts have recovered or been eaten — restore siren
    const prevFrightened = prev.ghosts.some(g => g.mode === 'frightened');
    const nextFrightened = next.ghosts.some(g => g.mode === 'frightened');
    if (prevFrightened && !nextFrightened && next.phase === 'playing') {
      engine.stopFrightened();
      engine.startSiren();
    }

    // Player died
    if (prev.phase !== 'dying' && next.phase === 'dying') {
      engine.stopSiren();
      engine.stopFrightened();
      engine.playDeath();
      haptics.death();
    }

    // Level complete
    if (prev.phase !== 'level-complete' && next.phase === 'level-complete') {
      engine.stopSiren();
      engine.stopFrightened();
      engine.playLevelComplete();
    }
  }, []);

  const loop = useCallback(
    (timestamp: number) => {
      if (pausedRef.current) return; // overlay visible — stop scheduling

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
        state.ghosts.forEach(g => renderer.drawGhost(g));
        renderer.drawPlayer(state.player);
        renderer.drawScorePopups(state.scorePopups);

        if (dyingElapsedRef.current >= DYING_PAUSE_MS) {
          dyingElapsedRef.current = 0;
          const newLives = state.lives - 1;
          const newPhase: GameState["phase"] =
            newLives <= 0 ? "game-over" : "playing";
          stateRef.current = resetPlayer({
            ...state,
            lives: newLives,
            phase: newPhase,
          });
          syncReact(stateRef.current);
          if (newPhase === "playing") {
            audioRef.current.startSiren();
          }
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
        state.ghosts.forEach(g => renderer.drawGhost(g));
        renderer.drawPlayer(state.player);
        renderer.drawScorePopups(state.scorePopups);
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
        const prev = stateRef.current;
        stateRef.current = tickGame(stateRef.current, FIXED_DT, MAZE_LEVEL_1);
        processAudio(prev, stateRef.current);
        accumRef.current -= FIXED_DT;
        if (stateRef.current.phase !== "playing") break;
      }

      renderer.clear();
      renderer.drawMaze(
        MAZE_LEVEL_1,
        stateRef.current.pellets,
        stateRef.current.powerPills
      );
      stateRef.current.ghosts.forEach(g => renderer.drawGhost(g));
      renderer.drawPlayer(stateRef.current.player);
      renderer.drawScorePopups(stateRef.current.scorePopups);

      syncReact(stateRef.current);

      rafRef.current = requestAnimationFrame(loop);
    },
    [canvasRef, syncReact]
  );

  // Sync pausedRef and resume loop when unpausing
  useEffect(() => {
    const wasPaused = pausedRef.current;
    pausedRef.current = paused;
    if (wasPaused && !paused) {
      lastTimeRef.current = -1; // reset timing to avoid large dt spike on resume
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [paused, loop]);

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
    audioRef.current.stopFrightened();
    audioRef.current.stopSiren();
    audioRef.current.startSiren();
    start();
  }, [start, syncReact]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    rendererRef.current = new Renderer(canvas);
    inputRef.current = createInputManager(canvas.parentElement ?? document.body);
    start();

    const engine = audioRef.current;

    function handleFirstGesture() {
      engine.init();
      const state = stateRef.current;
      if (state.phase === 'playing') {
        if (state.ghosts.some(g => g.mode === 'frightened')) {
          engine.startFrightened();
        } else {
          engine.startSiren();
        }
      }
      document.removeEventListener('keydown', handleFirstGesture);
      document.removeEventListener('pointerdown', handleFirstGesture);
    }
    document.addEventListener('keydown', handleFirstGesture);
    document.addEventListener('pointerdown', handleFirstGesture);

    function onResize() {
      rendererRef.current?.scaleToFit(canvas!);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      inputRef.current?.destroy();
      engine.destroy();
      document.removeEventListener('keydown', handleFirstGesture);
      document.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener("resize", onResize);
    };
  }, [canvasRef, start]);

  return { score, lives, level, phase, restart };
}
