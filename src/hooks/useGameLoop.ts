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

const FIXED_DT        = 1 / 60;   // seconds per simulation step (~16.67 ms)
const DYING_PAUSE_MS  = 1500;
const COUNTDOWN_MS    = 3500;      // 3–2–1–GO! total duration
const LEVEL_FLASH_MS  = 1500;      // 3 × 500 ms flashes

export interface GameLoopHandle {
  score: number;
  lives: number;
  level: number;
  phase: GameState["phase"];
  pelletsEaten: number;
  ghostsEaten: number;
  restart: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
}

interface GameLoopOptions {
  paused?: boolean;
  soundEnabled?: boolean;
  hapticsEnabled?: boolean;
}

export function useGameLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: GameLoopOptions | boolean = false
): GameLoopHandle {
  const opts: GameLoopOptions =
    typeof options === "boolean" ? { paused: options } : options;
  const { paused = false, soundEnabled = true, hapticsEnabled = true } = opts;

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<GameState["phase"]>("playing");
  const [pelletsEaten, setPelletsEaten] = useState(0);
  const [ghostsEaten, setGhostsEaten] = useState(0);

  const stateRef    = useRef<GameState>(createInitialState());
  const rendererRef = useRef<Renderer | null>(null);
  const inputRef    = useRef<InputManager | null>(null);
  const audioRef    = useRef<AudioEngine>(new AudioEngine());
  const rafRef      = useRef<number>(0);
  const lastTimeRef = useRef<number>(-1);
  const accumRef    = useRef<number>(0);

  // Phase-specific timers
  const dyingElapsedRef      = useRef<number>(0);
  const countdownElapsedRef  = useRef<number>(0);
  const countdownActiveRef   = useRef<boolean>(false);
  const levelFlashElapsedRef = useRef<number>(0);

  const pausedRef       = useRef(paused);
  const hapticsEnabledRef = useRef(hapticsEnabled);
  const sheetPausedRef  = useRef(false);

  useEffect(() => { audioRef.current.enabled = soundEnabled; }, [soundEnabled]);
  useEffect(() => { hapticsEnabledRef.current = hapticsEnabled; }, [hapticsEnabled]);

  const syncReact = useCallback((s: GameState) => {
    setScore(s.score);
    setLives(s.lives);
    setLevel(s.level);
    setPhase(s.phase);
    setPelletsEaten(s.pelletsEatenThisLevel);
    setGhostsEaten(s.ghostsEatenThisLevel);
  }, []);

  const processAudio = useCallback((prev: GameState, next: GameState) => {
    const engine = audioRef.current;
    const h = hapticsEnabledRef.current;

    if (next.pellets.size < prev.pellets.size && next.powerPills.size === prev.powerPills.size) {
      engine.playBlip();
      if (h) haptics.pellet();
    }

    if (next.powerPills.size < prev.powerPills.size) {
      engine.playPowerPill();
      engine.stopSiren();
      engine.startFrightened();
    }

    const newlyEaten = next.ghosts.some((g, i) => g.mode === 'eaten' && prev.ghosts[i]?.mode !== 'eaten');
    if (newlyEaten) {
      engine.playGhostEaten();
      if (h) haptics.ghostEaten();
    }

    const prevFrightened = prev.ghosts.some(g => g.mode === 'frightened');
    const nextFrightened = next.ghosts.some(g => g.mode === 'frightened');
    if (prevFrightened && !nextFrightened && next.phase === 'playing') {
      engine.stopFrightened();
      engine.startSiren();
    }

    if (prev.phase !== 'dying' && next.phase === 'dying') {
      engine.stopSiren();
      engine.stopFrightened();
      engine.playDeath();
      if (h) haptics.death();
    }

    if (prev.phase !== 'level-complete' && next.phase === 'level-complete') {
      engine.stopSiren();
      engine.stopFrightened();
      engine.playLevelComplete();
    }
  }, []);

  const loop = useCallback(
    (timestamp: number) => {
      if (pausedRef.current || sheetPausedRef.current) return;

      const canvas   = canvasRef.current;
      const renderer = rendererRef.current;
      const input    = inputRef.current;
      if (!canvas || !renderer || !input) return;

      if (lastTimeRef.current < 0) lastTimeRef.current = timestamp;
      const rawDt = (timestamp - lastTimeRef.current) / 1000;
      const dt    = Math.min(rawDt, 0.1);
      lastTimeRef.current = timestamp;

      // Advance renderer animation clock every frame
      renderer.update(dt);

      const state = stateRef.current;

      // ── Countdown phase ────────────────────────────────────────────────
      if (countdownActiveRef.current) {
        countdownElapsedRef.current += dt * 1000;
        const elapsed = countdownElapsedRef.current;

        const text =
          elapsed < 1000 ? '3' :
          elapsed < 2000 ? '2' :
          elapsed < 3000 ? '1' : 'GO!';

        renderer.clear();
        renderer.drawMaze(MAZE_LEVEL_1, state.pellets, state.powerPills);
        state.ghosts.forEach(g => renderer.drawGhost(g));
        renderer.drawPlayer(state.player);
        renderer.drawCountdown(text);

        if (elapsed >= COUNTDOWN_MS) {
          countdownActiveRef.current = false;
          countdownElapsedRef.current = 0;
          // Start siren after countdown ends
          audioRef.current.startSiren();
        }

        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── Dying phase ────────────────────────────────────────────────────
      if (state.phase === "dying") {
        dyingElapsedRef.current += dt * 1000;

        renderer.clear();
        renderer.drawMaze(MAZE_LEVEL_1, state.pellets, state.powerPills);
        state.ghosts.forEach(g => renderer.drawGhost(g));
        renderer.drawPlayer(state.player, dyingElapsedRef.current);
        renderer.drawScorePopups(state.scorePopups);

        if (dyingElapsedRef.current >= DYING_PAUSE_MS) {
          dyingElapsedRef.current = 0;
          const newLives  = state.lives - 1;
          const newPhase: GameState["phase"] = newLives <= 0 ? "game-over" : "playing";
          stateRef.current = resetPlayer({ ...state, lives: newLives, phase: newPhase });
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

      // ── Game-over: render once and stop ───────────────────────────────
      if (state.phase === "game-over") {
        renderer.clear();
        renderer.drawMaze(MAZE_LEVEL_1, state.pellets, state.powerPills);
        state.ghosts.forEach(g => renderer.drawGhost(g));
        renderer.drawPlayer(state.player);
        renderer.drawScorePopups(state.scorePopups);
        syncReact(state);
        return;
      }

      // ── Level-complete: flash maze then show overlay ───────────────────
      if (state.phase === "level-complete") {
        levelFlashElapsedRef.current += dt * 1000;
        const flashElapsed = levelFlashElapsedRef.current;

        if (flashElapsed < LEVEL_FLASH_MS) {
          const flashWhite = Math.floor(flashElapsed / 250) % 2 === 1;
          renderer.clear();
          renderer.drawMaze(MAZE_LEVEL_1, state.pellets, state.powerPills, flashWhite);
          state.ghosts.forEach(g => renderer.drawGhost(g));
          renderer.drawPlayer(state.player);
          rafRef.current = requestAnimationFrame(loop);
          return; // don't syncReact yet — keeps overlay hidden during flash
        }

        // Flash complete — do final render then stop loop
        renderer.clear();
        renderer.drawMaze(MAZE_LEVEL_1, state.pellets, state.powerPills);
        state.ghosts.forEach(g => renderer.drawGhost(g));
        renderer.drawPlayer(state.player);
        syncReact(state); // now phase=level-complete → overlay appears
        return;
      }

      // ── Normal playing ────────────────────────────────────────────────
      const dir = input.getDirection();
      if (dir !== "none") {
        stateRef.current = {
          ...stateRef.current,
          player: { ...stateRef.current.player, nextDirection: dir },
        };
      }

      accumRef.current += dt;
      while (accumRef.current >= FIXED_DT) {
        const prev = stateRef.current;
        stateRef.current = tickGame(stateRef.current, FIXED_DT, MAZE_LEVEL_1);
        processAudio(prev, stateRef.current);
        accumRef.current -= FIXED_DT;
        if (stateRef.current.phase !== "playing") break;
      }

      renderer.clear();
      renderer.drawMaze(MAZE_LEVEL_1, stateRef.current.pellets, stateRef.current.powerPills);
      stateRef.current.ghosts.forEach(g => renderer.drawGhost(g));
      renderer.drawPlayer(stateRef.current.player);
      renderer.drawScorePopups(stateRef.current.scorePopups);

      syncReact(stateRef.current);

      rafRef.current = requestAnimationFrame(loop);
    },
    [canvasRef, syncReact, processAudio]
  );

  useEffect(() => {
    const wasPaused = pausedRef.current;
    pausedRef.current = paused;
    if (wasPaused && !paused && !sheetPausedRef.current) {
      lastTimeRef.current = -1;
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [paused, loop]);

  const pauseGame = useCallback(() => {
    sheetPausedRef.current = true;
  }, []);

  const resumeGame = useCallback(() => {
    sheetPausedRef.current = false;
    if (!pausedRef.current) {
      lastTimeRef.current = -1;
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [loop]);

  const start = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lastTimeRef.current    = -1;
    accumRef.current       = 0;
    dyingElapsedRef.current = 0;
    levelFlashElapsedRef.current = 0;
    countdownElapsedRef.current  = 0;
    countdownActiveRef.current   = true; // countdown before each game start
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const restart = useCallback(() => {
    stateRef.current = createInitialState();
    syncReact(stateRef.current);
    audioRef.current.stopFrightened();
    audioRef.current.stopSiren();
    // Siren starts after countdown completes (inside loop)
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
      if (state.phase === 'playing' && !countdownActiveRef.current) {
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

  return { score, lives, level, phase, pelletsEaten, ghostsEaten, restart, pauseGame, resumeGame };
}
