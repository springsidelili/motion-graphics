import type { Ctx } from './assets';
import type { BG } from './post';

/** A timeline entry. draw() must be a pure function of t (global seconds). */
export interface Scene {
  id: string;
  start: number;
  end: number;
  draw(ctx: Ctx, t: number): void;
  /** background parameters while this scene is the top-most active one */
  bg?(t: number): BG;
}
