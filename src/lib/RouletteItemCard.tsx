import type { ReelCell } from './types'

export type CardVariant = 'glass' | 'solid' | 'minimal'
export type CardRarityStyle = 'dot' | 'strip' | 'glow' | 'border' | 'none'

export interface CardOptions {
  /** Visual style of the card. Default 'glass'. */
  variant?: CardVariant
  /** How the rarity color is displayed. Default 'dot'. */
  rarityStyle?: CardRarityStyle
  /** Show the item image. Default true. */
  showImage?: boolean
  /** Show the item name. Default true. */
  showName?: boolean
  /** Show the subtitle. Default true. */
  showSubtitle?: boolean
  /** Extra classes appended to the card root. */
  className?: string
}

export interface RouletteItemCardProps<T = unknown> {
  cell: ReelCell<T>
  /** True when the spin ended and this cell is the winner. */
  highlighted: boolean
  /** True when the spin ended and this cell is NOT the winner. */
  dimmed: boolean
  options?: CardOptions
}

const VARIANT_CLS: Record<CardVariant, { base: string; win: string; idle: string }> = {
  glass: {
    base: 'border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:bg-white/[0.035] dark:shadow-none dark:backdrop-blur-sm',
    win: 'border-black/20 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:border-white/25 dark:bg-white/[0.07] dark:shadow-[0_8px_40px_rgba(0,0,0,0.45)]',
    idle: 'border-black/[0.07] dark:border-white/[0.07]',
  },
  solid: {
    base: 'border bg-slate-100 dark:bg-[#17171c]',
    win: 'border-black/25 dark:border-white/30',
    idle: 'border-black/[0.06] dark:border-white/[0.05]',
  },
  minimal: {
    base: 'bg-transparent',
    win: '',
    idle: '',
  },
}

/**
 * Default card with built-in variants. Replace it entirely via the
 * `renderItem` prop of <ReelRoulette /> for full control.
 */
export function RouletteItemCard<T = unknown>({
  cell,
  highlighted,
  dimmed,
  options = {},
}: RouletteItemCardProps<T>) {
  const {
    variant = 'glass',
    rarityStyle = 'dot',
    showImage = true,
    showName = true,
    showSubtitle = true,
    className = '',
  } = options
  const { item } = cell
  const color = item.color ?? '#98989d'
  const v = VARIANT_CLS[variant]

  const hasImage = showImage && !!item.image
  const hasName = showName && !!item.name
  const hasSubtitle = showSubtitle && !!item.subtitle
  const hasText = hasName || hasSubtitle

  return (
    <div
      className={[
        'relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl',
        v.base,
        'transition-all duration-700 ease-out',
        dimmed ? 'opacity-25 blur-[1px]' : 'opacity-100',
        highlighted ? `scale-[1.03] ${v.win}` : v.idle,
        className,
      ].join(' ')}
      style={
        rarityStyle === 'border'
          ? { borderColor: highlighted ? color : `${color}55` }
          : highlighted && rarityStyle === 'glow'
            ? { boxShadow: `0 0 28px ${color}59, inset 0 0 24px ${color}1f` }
            : undefined
      }
    >
      {variant === 'glass' && (
        <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r from-transparent via-white/20 to-transparent dark:block" />
      )}

      {rarityStyle === 'strip' && (
        <div
          className="absolute inset-x-0 bottom-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
      )}

      {rarityStyle === 'glow' && (
        <div
          className={[
            'pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-opacity duration-300',
            highlighted ? 'opacity-90' : 'opacity-30',
          ].join(' ')}
          style={{ background: color }}
        />
      )}

      {/* visible content — always centered as one block */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-1.5 px-3 py-2">
        {hasImage && (
          <img
            src={item.image ?? undefined}
            alt={item.name ?? ''}
            draggable={false}
            className={[
              'w-auto max-w-[78%] shrink-0 select-none object-contain',
              hasText ? 'max-h-[48%]' : 'max-h-[68%]',
              'transition-transform duration-700 ease-out',
              highlighted ? 'scale-[1.08]' : '',
              'drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_10px_14px_rgba(0,0,0,0.5)]',
            ].join(' ')}
          />
        )}

        {hasText && (
          <div className="w-full shrink-0 text-center">
            {hasName && (
              <p className="truncate text-[11px] font-medium tracking-tight text-slate-900 dark:text-white/90 sm:text-[12px]">
                {item.name}
              </p>
            )}
            {hasSubtitle && (
              <p
                className={[
                  'flex items-center justify-center gap-1.5 truncate text-[9px] font-medium sm:text-[10px]',
                  hasName ? 'mt-0.5' : '',
                ].join(' ')}
                style={
                  rarityStyle === 'none' || rarityStyle === 'dot'
                    ? undefined
                    : { color }
                }
              >
                {rarityStyle === 'dot' && (
                  <span
                    className="inline-block h-[5px] w-[5px] shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                )}
                <span className={rarityStyle === 'dot' || rarityStyle === 'none' ? 'text-slate-500 dark:text-white/35' : ''}>
                  {item.subtitle}
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
