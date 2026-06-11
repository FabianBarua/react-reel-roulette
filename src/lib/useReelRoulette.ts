import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { easeOutSpin } from './easings'
import type {
  ReelRouletteConfig,
  ReelCell,
  RouletteItem,
  RouletteStatus,
  SpinOptions,
  UseReelRouletteReturn,
} from './types'

const DEFAULTS = {
  duration: 7000,
  reelLength: 60,
  landingJitter: 0.4,
  leadPadding: 4,
  respectReducedMotion: true,
} as const

const itemWeight = <T,>(it: RouletteItem<T>): number =>
  typeof it.weight === 'number' && it.weight > 0 ? it.weight : it.weight === 0 ? 0 : 1

function pickWeighted<T>(items: RouletteItem<T>[], rng: () => number): RouletteItem<T> {
  const total = items.reduce((sum, it) => sum + itemWeight(it), 0)
  if (total <= 0) return items[Math.floor(rng() * items.length)]
  let roll = rng() * total
  for (const it of items) {
    roll -= itemWeight(it)
    if (roll <= 0) return it
  }
  return items[items.length - 1]
}

function buildReel<T>(
  items: RouletteItem<T>[],
  winner: RouletteItem<T>,
  reelLength: number,
  winnerIndex: number,
  leadPadding: number,
  rng: () => number,
): ReelCell<T>[] {
  const total = leadPadding + reelLength
  const absWinner = leadPadding + winnerIndex
  const cells: ReelCell<T>[] = []
  for (let i = 0; i < total; i++) {
    const isWinner = i === absWinner
    let item: RouletteItem<T>
    if (isWinner) {
      item = winner
    } else {
      item = items[Math.floor(rng() * items.length)]
      // avoid an identical visible neighbor of the winner so the stop reads clearly
      if (Math.abs(i - absWinner) === 1 && item.id === winner.id && items.length > 1) {
        item = items.find((it) => it.id !== winner.id) ?? item
      }
    }
    cells.push({ key: `${i}-${item.id}`, item, index: i, isWinner })
  }
  return cells
}

/**
 * Headless engine of the horizontal reel roulette.
 *
 * Mechanics:
 * 1. On spin, a long reel of random cells is generated with the winner planted near the end.
 * 2. The track is translated with requestAnimationFrame using an ease-out curve,
 *    so it launches fast and decelerates into a very slow stop.
 * 3. Final offset = center of winner cell - center of viewport ± random jitter
 *    inside the cell, then (optionally) a short "settle" back to dead center.
 *
 * Measurements are taken from the DOM (first cell width + gap), so any card
 * size / responsive layout works without configuration.
 */
export function useReelRoulette<T = unknown>(
  items: RouletteItem<T>[],
  config: ReelRouletteConfig = {},
): UseReelRouletteReturn<T> {
  const {
    duration = DEFAULTS.duration,
    reelLength = DEFAULTS.reelLength,
    winnerIndex = reelLength - 8,
    landingJitter = DEFAULTS.landingJitter,
    easing = easeOutSpin,
    leadPadding = DEFAULTS.leadPadding,
    respectReducedMotion = DEFAULTS.respectReducedMotion,
  } = config

  const [status, setStatus] = useState<RouletteStatus>('idle')
  const [winner, setWinner] = useState<RouletteItem<T> | null>(null)
  const [reel, setReel] = useState<ReelCell<T>[]>([])

  const trackRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef(0)
  const statusRef = useRef<RouletteStatus>('idle')
  const itemsRef = useRef(items)
  useEffect(() => {
    statusRef.current = status
    itemsRef.current = items
  }, [status, items])

  // Idle reel so the tape is populated before the first spin.
  const idleReel = useMemo<ReelCell<T>[]>(
    () =>
      items.length
        ? Array.from({ length: Math.min(reelLength, 30) }, (_, i) => {
            const item = items[i % items.length]
            return { key: `idle-${i}-${item.id}`, item, index: i, isWinner: false }
          })
        : [],
    [items, reelLength],
  )

  const setTranslate = useCallback((x: number) => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-x}px, 0, 0)`
    }
  }, [])

  /**
   * Translate (in px) that puts the center of cell `index` exactly under the
   * viewport center. Reads the real DOM position (offsetLeft), so any padding,
   * gap or responsive cell width is automatically accounted for.
   */
  const offsetForIndex = useCallback((index: number): number | null => {
    const track = trackRef.current
    const viewport = viewportRef.current
    if (!track || !viewport || track.children.length === 0) return null
    const cell = track.children[Math.min(index, track.children.length - 1)] as HTMLElement
    return cell.offsetLeft + cell.offsetWidth / 2 - viewport.clientWidth / 2
  }, [])

  // Index of the cell that should sit under the pointer when not animating.
  const anchorIndexRef = useRef<number | null>(null)

  const recenter = useCallback(() => {
    if (statusRef.current === 'spinning') return
    const idx =
      anchorIndexRef.current ??
      Math.floor((reel.length ? reel.length : idleReel.length) / 2)
    const off = offsetForIndex(idx)
    if (off != null) setTranslate(off)
  }, [offsetForIndex, setTranslate, reel.length, idleReel.length])

  // Center on mount / whenever the reel renders, and keep centered on resize.
  useLayoutEffect(() => {
    recenter()
    const viewport = viewportRef.current
    if (!viewport || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(recenter)
    ro.observe(viewport)
    return () => ro.disconnect()
  }, [recenter])

  const stopAnimation = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
  }, [])

  const reset = useCallback(() => {
    stopAnimation()
    anchorIndexRef.current = null
    setStatus('idle')
    setWinner(null)
    setReel([])
  }, [stopAnimation])

  useEffect(() => stopAnimation, [stopAnimation])

  const spin = useCallback(
    (optionsOrWinnerId: SpinOptions<T> | string = {}): Promise<RouletteItem<T> | null> => {
      const options: SpinOptions<T> =
        typeof optionsOrWinnerId === 'string'
          ? { winner: optionsOrWinnerId }
          : optionsOrWinnerId
      const catalog = itemsRef.current
      if (!catalog.length || statusRef.current === 'spinning') {
        return Promise.resolve(null)
      }

      const rng = Math.random
      let resolvedWinner: RouletteItem<T>
      if (options.winner != null) {
        resolvedWinner =
          typeof options.winner === 'string'
            ? catalog.find((it) => it.id === options.winner) ?? pickWeighted(catalog, rng)
            : options.winner
      } else {
        resolvedWinner = pickWeighted(catalog, rng)
      }

      const newReel = buildReel(catalog, resolvedWinner, reelLength, winnerIndex, leadPadding, rng)
      setReel(newReel)
      setWinner(resolvedWinner)
      setStatus('spinning')

      return new Promise((resolve) => {
        // wait a frame so the new reel is in the DOM before measuring
        requestAnimationFrame(() => {
          const absWinner = leadPadding + winnerIndex
          const perfect = offsetForIndex(absWinner)
          if (perfect == null) {
            setStatus('done')
            resolve(resolvedWinner)
            return
          }
          const cellWidth =
            (trackRef.current?.children[absWinner] as HTMLElement | undefined)?.offsetWidth ?? 0
          const jitter = (rng() * 2 - 1) * landingJitter * (cellWidth / 2)
          const target = perfect + jitter
          const settleTarget = perfect // glide back to dead center after landing
          anchorIndexRef.current = absWinner

          const reduced =
            respectReducedMotion &&
            typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

          const spinDuration = reduced ? 0 : options.duration ?? duration

          const finish = () => {
            setTranslate(settleTarget)
            setStatus('done')
            resolve(resolvedWinner)
          }

          if (spinDuration <= 0) {
            finish()
            return
          }

          const start = performance.now()
          // Every spin launches from the head of the (freshly generated) reel,
          // so the travel distance — and therefore the perceived speed — is
          // identical on every spin. The reel content just changed, so this
          // jump is invisible.
          const from = offsetForIndex(Math.floor(leadPadding / 2)) ?? 0
          setTranslate(from)

          const frame = (now: number) => {
            const t = Math.min((now - start) / spinDuration, 1)
            setTranslate(from + (target - from) * easing(t))
            if (t < 1) {
              rafRef.current = requestAnimationFrame(frame)
              return
            }
            // settle phase: ease the jitter back to dead center
            const settleStart = performance.now()
            const settleDuration = 450
            const settleFrame = (n: number) => {
              const st = Math.min((n - settleStart) / settleDuration, 1)
              const e = 1 - Math.pow(1 - st, 3)
              setTranslate(target + (settleTarget - target) * e)
              if (st < 1) {
                rafRef.current = requestAnimationFrame(settleFrame)
              } else {
                finish()
              }
            }
            rafRef.current = requestAnimationFrame(settleFrame)
          }
          rafRef.current = requestAnimationFrame(frame)
        })
      })
    },
    [
      duration,
      easing,
      landingJitter,
      leadPadding,
      offsetForIndex,
      reelLength,
      respectReducedMotion,
      setTranslate,
      winnerIndex,
    ],
  )

  return {
    reel: reel.length ? reel : idleReel,
    status,
    winner,
    isSpinning: status === 'spinning',
    spin,
    reset,
    trackRef,
    viewportRef,
  }
}
