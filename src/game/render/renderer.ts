import { COLS, ROWS, TILE_SIZE } from '../data/constants';
import { MazeGrid } from '../data/maze';
import { Direction, GhostState, PlayerState, ScorePopup } from '../engine/types';

// Wall colour — matches --color-wall token in globals.css
const WALL_COLOR = '#1a1aff';
const PELLET_COLOR = '#ffffff';
const PLAYER_COLOR = '#ffdd00';

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private frameCounter = 0;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D rendering context');
    this.ctx = ctx;
    this.scaleToFit(canvas);
  }

  scaleToFit(canvas: HTMLCanvasElement): void {
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;
  }

  clear(): void {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  drawMaze(maze: MazeGrid, pellets: Set<string>, powerPills: Set<string>): void {
    const { ctx } = this;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = maze[row][col];
        const px = col * TILE_SIZE;
        const py = row * TILE_SIZE;

        if (tile === 'wall') {
          ctx.fillStyle = WALL_COLOR;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          continue;
        }

        const key = `${col},${row}`;

        if (tile === 'pellet' && pellets.has(key)) {
          ctx.fillStyle = PELLET_COLOR;
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        if (tile === 'power-pill' && powerPills.has(key)) {
          ctx.fillStyle = PELLET_COLOR;
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  drawGhost(ghost: GhostState): void {
    const { ctx } = this;
    const px = ghost.pixel.x;
    const py = ghost.pixel.y;
    const cx = px + TILE_SIZE / 2;
    const r  = TILE_SIZE / 2 - 1;

    // Eaten ghost: eyes only, no body
    if (ghost.eaten) {
      this.drawGhostEyes(cx, py + r, r, ghost.direction);
      return;
    }

    // Frightened: blue body (flashing white/blue in final 2s)
    if (ghost.mode === 'frightened') {
      const flashing = ghost.flashingTimer > 0 && Math.floor(ghost.flashingTimer / 200) % 2 === 0;
      ctx.fillStyle = flashing ? '#ffffff' : '#4444ff';
      this.drawGhostBody(px, py, cx, r);

      // Simple smile instead of eyes
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
    this.drawGhostEyes(cx, py + r, r, ghost.direction);
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

  private drawGhostEyes(cx: number, cy: number, r: number, direction: Direction): void {
    const { ctx } = this;
    const eyeOffsetX = r * 0.35;
    const eyeOffsetY = -r * 0.1;
    const eyeR = r * 0.28;
    const pupilR = eyeR * 0.55;
    const [dx, dy] = directionDelta(direction);

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
    ctx.fillStyle = '#00ffff';

    for (const popup of popups) {
      ctx.fillText(
        String(popup.score),
        popup.pixel.x + TILE_SIZE / 2,
        popup.pixel.y + TILE_SIZE / 2,
      );
    }
  }

  drawPlayer(player: PlayerState): void {
    this.frameCounter++;
    const { ctx } = this;

    const cx = player.pixel.x + TILE_SIZE / 2;
    const cy = player.pixel.y + TILE_SIZE / 2;
    const radius = TILE_SIZE / 2 - 1;

    const mouthAngle = player.moving
      ? Math.abs(Math.sin(this.frameCounter * 0.25)) * 0.3 * Math.PI
      : 0.05; // tiny gap even when still

    const rotation = directionAngle(player.direction);

    ctx.fillStyle = PLAYER_COLOR;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, rotation + mouthAngle, rotation + Math.PI * 2 - mouthAngle);
    ctx.closePath();
    ctx.fill();
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

function directionDelta(dir: Direction): [number, number] {
  switch (dir) {
    case 'right': return [1, 0];
    case 'left':  return [-1, 0];
    case 'down':  return [0, 1];
    case 'up':    return [0, -1];
    default:      return [1, 0];
  }
}
