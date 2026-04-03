import { COLS, ROWS, TILE_SIZE } from '../data/constants';
import { MazeGrid } from '../data/maze';
import { Direction, PlayerState } from '../engine/types';

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
