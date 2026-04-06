import { COLS, ROWS, SCORE_POPUP_DURATION, TILE_SIZE } from '../data/constants';
import { MazeGrid } from '../data/maze';
import { Direction, GhostName, GhostState, PlayerState, ScorePopup } from '../engine/types';

// Wall colours
const WALL_FILL    = '#00003b';   // dark navy interior
const WALL_HIGHLIGHT = '#4444ff'; // bright blue inner edge

const PELLET_COLOR = '#ffffff';
const PLAYER_COLOR = '#ffdd00';

// Ghost-house bounce: per-ghost phase offsets (radians)
const BOUNCE_PHASE: Record<GhostName, number> = {
  blinky: 0,
  pinky:  Math.PI / 2,
  inky:   Math.PI,
  clyde:  3 * Math.PI / 2,
};

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private frameCounter = 0;

  // Animation clock (seconds), driven by update()
  private animTime = 0;
  private lastDt = 1 / 60;

  // Per-ghost interpolated eye direction (radians, 0 = right)
  private ghostVisualAngles = new Map<GhostName, number>();

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D rendering context');
    this.ctx = ctx;
    this.scaleToFit(canvas);
  }

  /** Call once per frame before drawing to advance animation state. */
  update(dt: number): void {
    this.animTime += dt;
    this.lastDt = dt;
  }

  scaleToFit(canvas: HTMLCanvasElement): void {
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;
  }

  clear(): void {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  /** Draw the maze. flashWhite = true alternates wall colour for level-complete flash. */
  drawMaze(maze: MazeGrid, pellets: Set<string>, powerPills: Set<string>, flashWhite = false): void {
    const { ctx } = this;
    const wallFill = flashWhite ? '#ffffff' : WALL_FILL;
    const wallHL   = flashWhite ? '#aaaaff' : WALL_HIGHLIGHT;

    // ── Pass 1: batch all wall fills ──────────────────────────────────────
    ctx.fillStyle = wallFill;
    ctx.beginPath();
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (maze[row][col] === 'wall') {
          ctx.rect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
    ctx.fill();

    // ── Pass 2: batch all wall inner-edge highlights ───────────────────────
    ctx.strokeStyle = wallHL;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (maze[row][col] === 'wall') {
          this.addWallHighlight(maze, col, row);
        }
      }
    }
    ctx.stroke();

    // ── Pass 3: pellets (with pulse) ──────────────────────────────────────
    const pelletAlpha = 0.7 + 0.3 * Math.sin(this.animTime * Math.PI);  // ~0.5 Hz
    ctx.globalAlpha = pelletAlpha;
    ctx.fillStyle = PELLET_COLOR;
    ctx.beginPath();
    for (const key of pellets) {
      const [col, row] = key.split(',').map(Number);
      if (maze[row][col] !== 'pellet') continue;
      ctx.moveTo(col * TILE_SIZE + TILE_SIZE / 2 + 3, row * TILE_SIZE + TILE_SIZE / 2);
      ctx.arc(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2, 3, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.globalAlpha = 1;

    // ── Pass 4: power pills (with size pulse) ─────────────────────────────
    const pillScale = 1 + 0.1 * Math.sin(this.animTime * Math.PI);       // ±10%
    const pillR = 6 * pillScale;
    ctx.fillStyle = PELLET_COLOR;
    ctx.beginPath();
    for (const key of powerPills) {
      const [col, row] = key.split(',').map(Number);
      if (maze[row][col] !== 'power-pill') continue;
      ctx.moveTo(col * TILE_SIZE + TILE_SIZE / 2 + pillR, row * TILE_SIZE + TILE_SIZE / 2);
      ctx.arc(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2, pillR, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  /** Adds inner-edge highlight segments for a single wall tile to the current path. */
  private addWallHighlight(maze: MazeGrid, col: number, row: number): void {
    const isWall = (r: number, c: number) => maze[r]?.[c] === 'wall';

    const topOpen   = !isWall(row - 1, col);
    const botOpen   = !isWall(row + 1, col);
    const leftOpen  = !isWall(row, col - 1);
    const rightOpen = !isWall(row, col + 1);

    if (!topOpen && !botOpen && !leftOpen && !rightOpen) return;

    const { ctx } = this;
    const px   = col * TILE_SIZE;
    const py   = row * TILE_SIZE;
    const ins  = 1;   // inset from tile edge
    const arcR = 3;   // arc reaches arcR px from corner along each edge
    const r    = arcR - ins; // arc radius = 2

    // Straight edge segments (shortened to leave room for corner arcs)
    if (topOpen) {
      const x1 = px + (leftOpen  ? arcR : 0);
      const x2 = px + TILE_SIZE - (rightOpen ? arcR : 0);
      if (x1 < x2) { ctx.moveTo(x1, py + ins); ctx.lineTo(x2, py + ins); }
    }
    if (botOpen) {
      const x1 = px + (leftOpen  ? arcR : 0);
      const x2 = px + TILE_SIZE - (rightOpen ? arcR : 0);
      if (x1 < x2) { ctx.moveTo(x1, py + TILE_SIZE - ins); ctx.lineTo(x2, py + TILE_SIZE - ins); }
    }
    if (leftOpen) {
      const y1 = py + (topOpen ? arcR : 0);
      const y2 = py + TILE_SIZE - (botOpen ? arcR : 0);
      if (y1 < y2) { ctx.moveTo(px + ins, y1); ctx.lineTo(px + ins, y2); }
    }
    if (rightOpen) {
      const y1 = py + (topOpen ? arcR : 0);
      const y2 = py + TILE_SIZE - (botOpen ? arcR : 0);
      if (y1 < y2) { ctx.moveTo(px + TILE_SIZE - ins, y1); ctx.lineTo(px + TILE_SIZE - ins, y2); }
    }

    // Corner arcs (connecting adjacent open sides with a smooth curve)
    // TL: arc centre (px+ins, py+ins), 0° → 90° CW
    if (topOpen && leftOpen) {
      ctx.moveTo(px + arcR, py + ins);
      ctx.arc(px + ins, py + ins, r, 0, Math.PI / 2, false);
    }
    // TR: arc centre (px+TS-ins, py+ins), 90° → 180° CW
    if (topOpen && rightOpen) {
      ctx.moveTo(px + TILE_SIZE - ins, py + arcR);
      ctx.arc(px + TILE_SIZE - ins, py + ins, r, Math.PI / 2, Math.PI, false);
    }
    // BR: arc centre (px+TS-ins, py+TS-ins), 180° → 270° CW
    if (botOpen && rightOpen) {
      ctx.moveTo(px + TILE_SIZE - arcR, py + TILE_SIZE - ins);
      ctx.arc(px + TILE_SIZE - ins, py + TILE_SIZE - ins, r, Math.PI, 3 * Math.PI / 2, false);
    }
    // BL: arc centre (px+ins, py+TS-ins), 270° → 360° CW
    if (botOpen && leftOpen) {
      ctx.moveTo(px + ins, py + TILE_SIZE - arcR);
      ctx.arc(px + ins, py + TILE_SIZE - ins, r, 3 * Math.PI / 2, 2 * Math.PI, false);
    }
  }

  drawGhost(ghost: GhostState): void {
    const { ctx } = this;

    // Ghost-house bounce: bob ±4 px at ~1 Hz with per-ghost phase offset
    const bounceY = ghost.inHouse
      ? Math.sin(this.animTime * 2 * Math.PI + BOUNCE_PHASE[ghost.name]) * 4
      : 0;

    const px = ghost.pixel.x;
    const py = ghost.pixel.y + bounceY;
    const cx = px + TILE_SIZE / 2;
    const r  = TILE_SIZE / 2 - 1;

    // Eaten ghost: eyes only, no body
    if (ghost.eaten) {
      this.drawGhostEyes(cx, py + r, r, ghost.name, ghost.direction);
      return;
    }

    // Frightened: blue body (flashing white/blue in final 2s)
    if (ghost.mode === 'frightened') {
      const flashing = ghost.flashingTimer > 0 && Math.floor(ghost.flashingTimer / 200) % 2 === 0;
      ctx.fillStyle = flashing ? '#ffffff' : '#4444ff';
      this.drawGhostBody(px, py, cx, r);

      ctx.strokeStyle = flashing ? '#4444ff' : '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, py + r + r * 0.15, r * 0.4, 0, Math.PI);
      ctx.stroke();
      return;
    }

    // Normal ghost
    ctx.fillStyle = ghost.colour;
    this.drawGhostBody(px, py, cx, r);
    this.drawGhostEyes(cx, py + r, r, ghost.name, ghost.direction);
  }

  private drawGhostBody(px: number, py: number, cx: number, r: number): void {
    const { ctx } = this;
    const skirtY = py + TILE_SIZE - 1;
    const bump   = r / 1.5;

    ctx.beginPath();
    ctx.arc(cx, py + r, r, Math.PI, 0);
    ctx.lineTo(px + TILE_SIZE - 1, skirtY);
    ctx.quadraticCurveTo(px + TILE_SIZE - 1 - bump * 0.5, skirtY - bump, px + TILE_SIZE - 1 - bump, skirtY);
    ctx.quadraticCurveTo(cx - bump * 0.5, skirtY - bump, cx, skirtY);
    ctx.quadraticCurveTo(px + bump * 0.5, skirtY - bump, px + 1, skirtY);
    ctx.lineTo(px + 1, py + r);
    ctx.closePath();
    ctx.fill();
  }

  private drawGhostEyes(cx: number, cy: number, r: number, name: GhostName, direction: Direction): void {
    const { ctx } = this;
    const eyeOffsetX = r * 0.35;
    const eyeOffsetY = -r * 0.1;
    const eyeR  = r * 0.28;
    const pupilR = eyeR * 0.55;

    // Smooth direction interpolation
    const targetAngle = directionToAngle(direction);
    let current = this.ghostVisualAngles.get(name) ?? targetAngle;

    // Shortest-path angle interpolation
    let diff = targetAngle - current;
    while (diff >  Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    const LERP_SPEED = 12; // rad/s
    current += Math.sign(diff) * Math.min(Math.abs(diff), LERP_SPEED * this.lastDt);
    this.ghostVisualAngles.set(name, current);

    const dx = Math.cos(current);
    const dy = Math.sin(current);

    for (const side of [-1, 1]) {
      const ex = cx + side * eyeOffsetX;
      const ey = cy + eyeOffsetY;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1a1aff';
      ctx.beginPath();
      ctx.arc(ex + dx * eyeR * 0.5, ey + dy * eyeR * 0.5, pupilR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawScorePopups(popups: ScorePopup[]): void {
    const { ctx } = this;
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';

    for (const popup of popups) {
      const elapsed  = SCORE_POPUP_DURATION - popup.remaining;
      const floatY   = -(elapsed / SCORE_POPUP_DURATION) * 12;
      const alpha    = popup.remaining / SCORE_POPUP_DURATION;

      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = '#00ffff';
      ctx.fillText(
        String(popup.score),
        popup.pixel.x + TILE_SIZE / 2,
        popup.pixel.y + TILE_SIZE / 2 + floatY,
      );
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Draw the player.
   * @param player   Current player state.
   * @param deathMs  If provided (≥0), plays the death animation driven by elapsed ms.
   */
  drawPlayer(player: PlayerState, deathMs?: number): void {
    const { ctx } = this;

    const cx = player.pixel.x + TILE_SIZE / 2;
    const cy = player.pixel.y + TILE_SIZE / 2;
    const radius = TILE_SIZE / 2 - 1;
    const rotation = directionAngle(player.direction);

    // ── Death animation ───────────────────────────────────────────────────
    if (deathMs !== undefined && deathMs > 0) {
      const progress = Math.min(deathMs / 1500, 1);
      if (progress >= 1) return; // player has disappeared

      // Mouth angle sweeps from ~0.1 rad (nearly closed) to π (full open = invisible)
      const mouthAngle = 0.1 + (Math.PI - 0.1) * progress;

      ctx.fillStyle = PLAYER_COLOR;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, rotation + mouthAngle, rotation + Math.PI * 2 - mouthAngle);
      ctx.closePath();
      ctx.fill();
      return;
    }

    // ── Normal chomping animation ─────────────────────────────────────────
    this.frameCounter++;
    const mouthAngle = player.moving
      ? Math.abs(Math.sin(this.frameCounter * 0.25)) * 0.3 * Math.PI
      : 0.05;

    ctx.fillStyle = PLAYER_COLOR;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, rotation + mouthAngle, rotation + Math.PI * 2 - mouthAngle);
    ctx.closePath();
    ctx.fill();
  }

  /** Draw countdown text ("3", "2", "1", "GO!") centred on the canvas. */
  drawCountdown(text: string): void {
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = `16px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = text === 'GO!' ? '#00ff00' : '#ffdd00';
    ctx.fillText(text, w / 2, h / 2);
    ctx.textBaseline = 'alphabetic';
  }
}

function directionAngle(dir: Direction): number {
  switch (dir) {
    case 'right': return 0;
    case 'down':  return Math.PI / 2;
    case 'left':  return Math.PI;
    case 'up':    return -Math.PI / 2;
    default:      return 0;
  }
}

/** Converts a Direction to an angle for smooth interpolation (right=0, down=π/2, etc.). */
function directionToAngle(dir: Direction): number {
  switch (dir) {
    case 'right': return 0;
    case 'down':  return Math.PI / 2;
    case 'left':  return Math.PI;
    case 'up':    return -Math.PI / 2;
    default:      return 0;
  }
}
