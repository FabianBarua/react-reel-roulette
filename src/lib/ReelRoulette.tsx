import { useEffect, useImperativeHandle, type ReactNode, type Ref } from 'react'
import { RouletteItemCard, type CardOptions } from './RouletteItemCard'
import { useReelRoulette } from './useReelRoulette'
import type {
  ReelRouletteConfig,
  ReelCell,
  RouletteItem,
  RouletteStatus,
  SpinOptions,
} from './types'

export interface ReelRouletteHandle<T = unknown> {
  /** Spin the reel. Shorthand: `spin('item-id')` for a backend-decided winner. */
  spin: (options?: SpinOptions<T> | string) => Promise<RouletteItem<T> | null>
  reset: () => void
}

export type PointerVariant = 'frame' | 'arrow' | 'line' | 'none'

export interface ReelRouletteClassNames {
  /** Outer frame. */
  root?: string
  /** Clipping viewport. */
  viewport?: string
  /** Each cell wrapper. */
  cell?: string
}

export interface ReelRouletteProps<T = unknown> extends ReelRouletteConfig {
  /** Catalog of possible items. */
  items: RouletteItem<T>[]
  /** Imperative handle: ref.current.spin() / ref.current.reset(). */
  handleRef?: Ref<ReelRouletteHandle<T>>
  /** Called when a spin starts. */
  onSpinStart?: (winner: RouletteItem<T>) => void
  /** Called when the reel stops on the winner. */
  onSpinEnd?: (winner: RouletteItem<T>) => void
  /** Card width in px (mobile). Default 112. */
  itemWidth?: number
  /** Card width in px from the `sm` breakpoint up. Default 144. */
  itemWidthDesktop?: number
  /** Tape height in px (mobile / desktop). Defaults 128 / 166. */
  height?: number
  heightDesktop?: number
  /** Custom card renderer. Receives the cell + end-of-spin flags. */
  renderItem?: (cell: ReelCell<T>, status: RouletteStatus) => ReactNode
  /** Options for the built-in card (variant, rarity style, visible info). */
  card?: CardOptions
  /** Built-in pointer style. Default 'frame'. */
  pointerVariant?: PointerVariant
  /** Fully custom pointer node (overrides pointerVariant). */
  pointer?: ReactNode
  /** Class overrides for the internal layout pieces. */
  classNames?: ReelRouletteClassNames
  /** Hide the lateral fade-out gradients. Default false. */
  hideEdgeFade?: boolean
  /**
   * Accent color for the center focus frame. If omitted, a neutral
   * frame is used that adapts to Tailwind dark/light automatically.
   */
  accentColor?: string
  className?: string
}

/**
 * Horizontal reel roulette (scrolling tape).
 *
 * Fully self-contained: drop the folder into any React + Tailwind project.
 * Headless logic lives in useReelRoulette; this component is just the skin.
 */
export function ReelRoulette<T = unknown>({
  items,
  handleRef,
  onSpinStart,
  onSpinEnd,
  itemWidth = 112,
  itemWidthDesktop = 144,
  height = 128,
  heightDesktop = 166,
  renderItem,
  card,
  pointerVariant = 'frame',
  pointer,
  classNames = {},
  hideEdgeFade = false,
  accentColor,
  className = '',
  ...config
}: ReelRouletteProps<T>) {
  const roulette = useReelRoulette<T>(items, config)
  const { reel, status, trackRef, viewportRef } = roulette

  useImperativeHandle(handleRef, () => ({
    spin: async (options?: SpinOptions<T> | string) => {
      const w = await roulette.spin(options)
      if (w) onSpinEnd?.(w)
      return w
    },
    reset: roulette.reset,
  }))

  useEffect(() => {
    if (status === 'spinning' && roulette.winner) {
      onSpinStart?.(roulette.winner)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const done = status === 'done'

  return (
    <div
      className={[
        'relative w-full rounded-[28px] border p-2 backdrop-blur-xl',
        'border-black/[0.08] bg-black/[0.03] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)]',
        'dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)]',
        classNames.root ?? '',
        className,
      ].join(' ')}
    >
      <div
        ref={viewportRef}
        className={`relative h-(--tape-h) w-full overflow-hidden rounded-[20px] bg-slate-100 dark:bg-black/30 sm:h-(--tape-h-d) ${classNames.viewport ?? ''}`}
        style={
          {
            '--tape-h': `${height}px`,
            '--tape-h-d': `${heightDesktop}px`,
            '--cell-w': `${itemWidth}px`,
            '--cell-w-d': `${itemWidthDesktop}px`,
          } as React.CSSProperties
        }
      >
        {/* tape */}
        <div
          ref={trackRef}
          className="flex h-full items-stretch gap-2 p-2 will-change-transform"
          style={{ transform: 'translate3d(0,0,0)' }}
        >
          {reel.map((cell) => (
            <div
              key={cell.key}
              className={`h-full w-(--cell-w) shrink-0 sm:w-(--cell-w-d) ${classNames.cell ?? ''}`}
            >
              {renderItem ? (
                renderItem(cell, status)
              ) : (
                <RouletteItemCard
                  cell={cell}
                  highlighted={done && cell.isWinner}
                  dimmed={done && !cell.isWinner}
                  options={card}
                />
              )}
            </div>
          ))}
        </div>

        {/* edge fade */}
        {!hideEdgeFade && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 z-[6] w-16 bg-gradient-to-r from-slate-100 to-transparent dark:from-[#0e0e11] sm:w-28" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-[6] w-16 bg-gradient-to-l from-slate-100 to-transparent dark:from-[#0e0e11] sm:w-28" />
          </>
        )}

        {/* center pointer */}
        {pointer ? (
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 -translate-x-1/2">
            {pointer}
          </div>
        ) : (
          <Pointer variant={pointerVariant} accentColor={accentColor} />
        )}
      </div>
    </div>
  )
}

function Pointer({
  variant,
  accentColor,
}: {
  variant: PointerVariant
  accentColor?: string
}) {
  if (variant === 'none') return null

  const colorStyle = accentColor ? { color: accentColor } : undefined
  const neutral = 'text-black/60 dark:text-white/80'

  if (variant === 'frame') {
    return (
      <div className="pointer-events-none absolute inset-y-2 left-1/2 z-10 w-(--cell-w) -translate-x-1/2 sm:w-(--cell-w-d)">
        <div
          className={[
            'relative h-full w-full rounded-2xl border transition-colors duration-500',
            accentColor
              ? ''
              : 'border-black/30 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:border-white/35 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_30px_rgba(255,255,255,0.08)]',
          ].join(' ')}
          style={
            accentColor
              ? {
                  borderColor: `${accentColor}73`,
                  boxShadow: `0 0 0 1px ${accentColor}26, 0 0 30px ${accentColor}1a`,
                }
              : undefined
          }
        >
          <div
            className={`absolute -top-2 left-1/2 h-2 w-px -translate-x-1/2 ${accentColor ? '' : 'bg-black/50 dark:bg-white/70'}`}
            style={accentColor ? { background: accentColor } : undefined}
          />
          <div
            className={`absolute -bottom-2 left-1/2 h-2 w-px -translate-x-1/2 ${accentColor ? '' : 'bg-black/50 dark:bg-white/70'}`}
            style={accentColor ? { background: accentColor } : undefined}
          />
        </div>
      </div>
    )
  }

  if (variant === 'arrow') {
    return (
      <div
        className={`pointer-events-none absolute inset-y-0 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center justify-between ${accentColor ? '' : neutral}`}
        style={colorStyle}
      >
        <svg width="16" height="10" viewBox="0 0 14 9">
          <path d="M7 9 0 0h14L7 9Z" fill="currentColor" />
        </svg>
        <div className="w-px flex-1 bg-gradient-to-b from-current via-current/25 to-current" />
        <svg width="16" height="10" viewBox="0 0 14 9">
          <path d="M7 0 0 9h14L7 0Z" fill="currentColor" />
        </svg>
      </div>
    )
  }

  // line
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[2px] -translate-x-1/2 rounded-full ${accentColor ? '' : 'bg-black/40 dark:bg-white/60'}`}
      style={accentColor ? { background: accentColor } : undefined}
    />
  )
}
