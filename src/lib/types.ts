/**
 * Item that travels on the roulette reel. Fully agnostic: bring your own data via `data`.
 * Every field except `id` is optional and accepts `null`, so API payloads can be passed as-is.
 */
export interface RouletteItem<T = unknown> {
  /** Unique id of the catalog item (not of the reel cell). */
  id: string
  /** Image shown on the card (url or imported asset). */
  image?: string | null
  /** Main label. */
  name?: string | null
  /** Secondary label (e.g. skin wear, subtitle). */
  subtitle?: string | null
  /** Rarity color, any CSS color (drives the rarity accents on the default card). */
  color?: string | null
  /**
   * Relative drop weight for client-side random selection (default 1).
   * Ignored when the winner comes from your backend via spin().
   * NOTE: client-side selection is cosmetic — for anything with real value,
   * decide the winner server-side and pass it to spin().
   */
  weight?: number | null
  /** Anything else you need in your custom renderer. */
  data?: T
}

/** A cell of the generated reel: a catalog item plus its position. */
export interface ReelCell<T = unknown> {
  key: string
  item: RouletteItem<T>
  index: number
  isWinner: boolean
}

export type RouletteStatus = 'idle' | 'spinning' | 'done'

export interface ReelRouletteConfig {
  /** Spin duration in ms. Default 6000. */
  duration?: number
  /** Total cells generated on the reel. Default 60. */
  reelLength?: number
  /** Index (from the start) where the winner is placed. Default reelLength - 8. */
  winnerIndex?: number
  /**
   * Random landing offset inside the winning cell, 0..1 fraction of the cell width.
   * 0 = always lands dead-center. Default 0.4 (like the original site).
   */
  landingJitter?: number
  /** Easing function t->t (0..1). Default easeOutQuint (fast start, very slow stop). */
  easing?: (t: number) => number
  /** Number of filler cells before index 0 so the reel never shows a gap. Default 4. */
  leadPadding?: number
  /** Respect prefers-reduced-motion (jump straight to result). Default true. */
  respectReducedMotion?: boolean
}

export interface SpinOptions<T = unknown> {
  /**
   * Force the winner (id or the item itself), e.g. when your backend decides the drop.
   * If omitted, a weighted random pick is made client-side.
   */
  winner?: string | RouletteItem<T>
  /** Override the duration for this spin only. */
  duration?: number
}

export interface UseReelRouletteReturn<T = unknown> {
  /** Cells to render, in order. Regenerated on every spin. */
  reel: ReelCell<T>[]
  /** Current state machine status. */
  status: RouletteStatus
  /** The winning item of the current/last spin (set as soon as spin starts). */
  winner: RouletteItem<T> | null
  /** True while animating. */
  isSpinning: boolean
  /**
   * Start a spin. Resolves with the winner when the reel stops.
   * Shorthand: pass the winner id directly — `spin('rare-knife')`.
   */
  spin: (options?: SpinOptions<T> | string) => Promise<RouletteItem<T> | null>
  /** Cancel + reset to idle. */
  reset: () => void
  /** Attach to the scrolling track element (the one that gets translateX). */
  trackRef: React.RefObject<HTMLDivElement | null>
  /** Attach to the clipping viewport element (overflow-hidden container). */
  viewportRef: React.RefObject<HTMLDivElement | null>
}
