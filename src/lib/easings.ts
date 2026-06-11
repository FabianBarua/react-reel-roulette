/** Easing functions t in [0,1] -> [0,1]. The default mimics a reel roulette "slow stop". */

export const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5)

/**
 * Default spin curve: fast launch, long readable deceleration, and a stop
 * that doesn't overstay (the tail crosses ~2 cells, not a sub-pixel crawl).
 */
export const easeOutSpin = (t: number): number => 1 - Math.pow(1 - t, 4.5)

export const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4)

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

export const easeOutExpo = (t: number): number =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t)

/** Very long tail: barely creeps at the end. */
export const easeOutLongTail = (t: number): number => {
  const p = 1 - Math.pow(1 - t, 4)
  return p * (2 - p)
}

/** Tiny elastic settle at the end (overshoots slightly and comes back). */
export const easeOutBackSoft = (t: number): number => {
  const c = 0.7
  const u = t - 1
  return 1 + (c + 1) * u * u * u + c * u * u
}
