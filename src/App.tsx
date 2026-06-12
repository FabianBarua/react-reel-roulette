import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ReelRoulette,
  easeOutBackSoft,
  easeOutCubic,
  easeOutExpo,
  easeOutQuint,
  easeOutSpin,
  type CardRarityStyle,
  type CardVariant,
  type ReelRouletteHandle,
  type PointerVariant,
  type RouletteItem,
} from './lib'
import { translations, type Lang } from './i18n'

/* ---------------------------------- data --------------------------------- */

const ITEM_IMAGES = Array.from(
  { length: 8 },
  (_, i) => `${import.meta.env.BASE_URL}skins/skin${i + 1}.webp`,
)

const DEFAULT_ITEMS: RouletteItem[] = [
  { id: 'dune', name: 'Dune Fragment', subtitle: 'Common', image: ITEM_IMAGES[0], color: '#b0c3d9', weight: 60 },
  { id: 'storm', name: 'Storm Shard', subtitle: 'Uncommon', image: ITEM_IMAGES[1], color: '#5e98d9', weight: 40 },
  { id: 'pulse', name: 'Pulse Core', subtitle: 'Rare', image: ITEM_IMAGES[2], color: '#4b69ff', weight: 25 },
  { id: 'nova', name: 'Nova Prism', subtitle: 'Epic', image: ITEM_IMAGES[3], color: '#8847ff', weight: 12 },
  { id: 'eclipse', name: 'Eclipse Relic', subtitle: 'Mythic', image: ITEM_IMAGES[4], color: '#d32ce6', weight: 5 },
  { id: 'ember', name: 'Ember Crown', subtitle: 'Legendary', image: ITEM_IMAGES[5], color: '#eb4b4b', weight: 2 },
  { id: 'aurora', name: 'Aurora Blade', subtitle: 'Legendary', image: ITEM_IMAGES[6], color: '#eb4b4b', weight: 1.5 },
  { id: 'singularity', name: '★ Singularity', subtitle: 'Exotic', image: ITEM_IMAGES[7], color: '#d4af37', weight: 0.5 },
]

const EASINGS = {
  easeOutSpin: easeOutSpin,
  easeOutQuint: easeOutQuint,
  easeOutCubic: easeOutCubic,
  easeOutExpo: easeOutExpo,
  easeOutBackSoft: easeOutBackSoft,
} as const

type EasingKey = keyof typeof EASINGS

/* --------------------------------- ui bits -------------------------------- */

const inputCls =
  'w-full rounded-xl border border-(--md-outline-variant) bg-(--md-surface-container-lowest) px-3 py-2 text-[13px] text-(--md-on-surface) outline-none transition focus:border-(--md-primary) dark:[color-scheme:dark]'

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-(--md-on-surface-variant)">{label}</span>
      {children}
    </label>
  )
}

function Code({
  children,
  copyLabel,
  copiedLabel,
}: {
  children: string
  copyLabel: string
  copiedLabel: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard?.writeText(children).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="relative rounded-[20px] bg-[#1d1b20] dark:bg-(--md-surface-container-lowest)">
      <button
        type="button"
        onClick={copy}
        className="absolute right-3 top-3 rounded-lg border border-white/10 px-3 py-1.5 text-[11.5px] font-medium text-[#e6e0e9]/70 transition hover:border-white/20 hover:bg-white/10 hover:text-[#e6e0e9] active:scale-95"
      >
        {copied ? copiedLabel : copyLabel}
      </button>
      <pre className="whitespace-pre-wrap break-words p-5 pr-24 text-[12.5px] leading-[1.7] text-[#e6e0e9]">
        {children}
      </pre>
    </div>
  )
}

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id?: string
  eyebrow: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-[28px] bg-(--md-surface-container-low) p-6 sm:p-10"
    >
      <span className="inline-flex items-center rounded-lg bg-(--md-secondary-container) px-3 py-1 text-[11.5px] font-medium text-(--md-on-secondary-container)">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-[28px] font-normal leading-snug sm:text-[32px]">{title}</h2>
      {description && (
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-(--md-on-surface-variant)">
          {description}
        </p>
      )}
      <div className="mt-8">{children}</div>
    </section>
  )
}

function DocTable({ rows, headers }: { rows: [string, string, string][]; headers: [string, string, string] }) {
  return (
    <div className="overflow-x-auto rounded-[20px] bg-(--md-surface-container-lowest)">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="bg-(--md-surface-container-high) text-[12px] font-medium text-(--md-on-surface-variant)">
            <th className="px-5 py-3.5 font-medium">{headers[0]}</th>
            <th className="px-5 py-3.5 font-medium">{headers[1]}</th>
            <th className="px-5 py-3.5 font-medium">{headers[2]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b, c]) => (
            <tr key={a} className="border-b border-(--md-outline-variant)/40 last:border-0">
              <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[12px] font-medium text-(--md-primary)">{a}</td>
              <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[12px] text-(--md-on-surface-variant)">{b}</td>
              <td className="px-5 py-3.5 leading-relaxed text-(--md-on-surface-variant)">{c}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* -------------------------------- header ui -------------------------------- */

function LangSwitcher({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div
      role="group"
      aria-label="Language"
      className="flex rounded-full bg-(--md-surface-container-high) p-1"
    >
      {(['en', 'es'] as const).map((l) => {
        const active = lang === l
        return (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            aria-pressed={active}
            className={[
              'relative rounded-full px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-wide transition-all duration-200',
              active
                ? 'bg-(--md-primary-container) text-(--md-on-primary-container) shadow-sm'
                : 'text-(--md-on-surface-variant) hover:text-(--md-on-surface)',
            ].join(' ')}
          >
            {l}
          </button>
        )
      })}
    </div>
  )
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-(--md-outline-variant)/60 bg-(--md-surface-container-lowest) text-[15px] transition hover:bg-(--md-surface-container-high) active:scale-95"
    >
      {dark ? '☀' : '☾'}
    </button>
  )
}

const NAV_LINKS = [
  { href: '#playground', key: 'playground' as const },
  { href: '#items', key: 'items' as const },
  { href: '#api', key: 'api' as const },
]

/* ---------------------------------- app ----------------------------------- */

let nextId = 1

function App() {
  const rouletteRef = useRef<ReelRouletteHandle>(null)
  const [spinning, setSpinning] = useState(false)
  const [won, setWon] = useState<RouletteItem | null>(null)
  const [dark, setDark] = useState(true)
  const [copied, setCopied] = useState(false)
  const [lang, setLang] = useState<Lang>(() =>
    typeof navigator !== 'undefined' && navigator.language.startsWith('es') ? 'es' : 'en',
  )
  const t = translations[lang]

  const [items, setItems] = useState<RouletteItem[]>(DEFAULT_ITEMS)

  // options
  const [duration, setDuration] = useState(7000)
  const [reelLength, setReelLength] = useState(60)
  const [landingJitter, setLandingJitter] = useState(0.4)
  const [easingKey, setEasingKey] = useState<EasingKey>('easeOutSpin')
  const [itemWidth, setItemWidth] = useState(112)
  const [itemWidthDesktop, setItemWidthDesktop] = useState(144)
  const [height, setHeight] = useState(128)
  const [heightDesktop, setHeightDesktop] = useState(166)
  const [useAccent, setUseAccent] = useState(false)
  const [accent, setAccent] = useState('#6366f1')
  const [forcedWinner, setForcedWinner] = useState('')
  const [cardVariant, setCardVariant] = useState<CardVariant>('glass')
  const [rarityStyle, setRarityStyle] = useState<CardRarityStyle>('dot')
  const [showImage, setShowImage] = useState(true)
  const [showName, setShowName] = useState(true)
  const [showSubtitle, setShowSubtitle] = useState(true)
  const [pointerVariant, setPointerVariant] = useState<PointerVariant>('frame')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // welcome spin so the page feels alive on first load
  const didAutoSpin = useRef(false)
  useEffect(() => {
    if (didAutoSpin.current) return
    didAutoSpin.current = true
    const t = setTimeout(async () => {
      setSpinning(true)
      const prize = await rouletteRef.current?.spin({ duration: 4500 })
      setWon(prize ?? null)
      setSpinning(false)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  const open = async () => {
    if (spinning || !items.length) return
    setSpinning(true)
    setWon(null)
    const prize = await rouletteRef.current?.spin(forcedWinner || undefined)
    setWon(prize ?? null)
    setSpinning(false)
  }

  const updateItem = (id: string, patch: Partial<RouletteItem>) =>
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)))

  const removeItem = (id: string) => {
    setItems((list) => list.filter((it) => it.id !== id))
    if (forcedWinner === id) setForcedWinner('')
  }

  const addItem = () =>
    setItems((list) => [
      ...list,
      {
        id: `item-${nextId++}`,
        name: t.items.newPrize,
        subtitle: 'Common',
        image: ITEM_IMAGES[list.length % ITEM_IMAGES.length],
        color: '#b0c3d9',
        weight: 10,
      },
    ])

  const snippet = useMemo(() => {
    const cardOpts = [
      cardVariant !== 'glass' ? `variant: '${cardVariant}'` : null,
      rarityStyle !== 'dot' ? `rarityStyle: '${rarityStyle}'` : null,
      !showImage ? 'showImage: false' : null,
      !showName ? 'showName: false' : null,
      !showSubtitle ? 'showSubtitle: false' : null,
    ].filter(Boolean)
    return [
      '<ReelRoulette',
      '  items={prizes}',
      '  handleRef={roulette}',
      duration !== 7000 ? `  duration={${duration}}` : null,
      reelLength !== 60 ? `  reelLength={${reelLength}}` : null,
      landingJitter !== 0.4 ? `  landingJitter={${landingJitter}}` : null,
      easingKey !== 'easeOutSpin' ? `  easing={${easingKey}}` : null,
      itemWidth !== 112 ? `  itemWidth={${itemWidth}}` : null,
      itemWidthDesktop !== 144 ? `  itemWidthDesktop={${itemWidthDesktop}}` : null,
      height !== 128 ? `  height={${height}}` : null,
      heightDesktop !== 166 ? `  heightDesktop={${heightDesktop}}` : null,
      useAccent ? `  accentColor="${accent}"` : null,
      cardOpts.length ? `  card={{ ${cardOpts.join(', ')} }}` : null,
      pointerVariant !== 'frame' ? `  pointerVariant="${pointerVariant}"` : null,
      '/>',
      '',
      forcedWinner
        ? `const prize = await roulette.current?.spin('${forcedWinner}')`
        : 'const prize = await roulette.current?.spin()',
    ]
      .filter((l): l is string => l !== null)
      .join('\n')
  }, [duration, reelLength, landingJitter, easingKey, itemWidth, itemWidthDesktop, height, heightDesktop, useAccent, accent, cardVariant, rarityStyle, showImage, showName, showSubtitle, pointerVariant, forcedWinner])

  const copyInstall = () => {
    navigator.clipboard?.writeText('npm i react-reel-roulette')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <main className="min-h-screen bg-(--md-surface) text-(--md-on-surface) antialiased transition-colors duration-500">
      {/* top app bar */}
      <header className="sticky top-0 z-30 border-b border-(--md-outline-variant)/50 bg-(--md-surface)/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-5">
          {/* brand */}
          <a href="#" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--md-primary) text-[14px] font-bold text-(--md-on-primary) shadow-sm">
              R
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-[14px] font-medium text-(--md-on-surface)">react-reel-roulette</span>
              <span className="text-[10.5px] text-(--md-on-surface-variant)">v0.1.0</span>
            </span>
          </a>

          {/* nav */}
          <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
            {NAV_LINKS.map(({ href, key }) => (
              <a
                key={key}
                href={href}
                className="rounded-full px-4 py-2 text-[13.5px] font-medium text-(--md-on-surface-variant) transition hover:bg-(--md-surface-container-high) hover:text-(--md-on-surface)"
              >
                {t.nav[key]}
              </a>
            ))}
          </nav>

          {/* actions */}
          <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
            <LangSwitcher lang={lang} onChange={setLang} />
            <ThemeToggle dark={dark} onToggle={() => setDark((d) => !d)} />
            <a
              href="https://github.com/FabianBarua/react-reel-roulette"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full bg-(--md-secondary-container) px-4 py-2 text-[13px] font-medium text-(--md-on-secondary-container) transition hover:brightness-105 active:scale-[0.98] sm:inline-flex"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>

        {/* mobile nav */}
        <nav className="flex items-center justify-center gap-1 border-t border-(--md-outline-variant)/30 px-4 py-1.5 md:hidden">
          {NAV_LINKS.map(({ href, key }) => (
            <a
              key={key}
              href={href}
              className="flex-1 rounded-full py-2 text-center text-[12.5px] font-medium text-(--md-on-surface-variant) transition hover:bg-(--md-surface-container-high) hover:text-(--md-on-surface)"
            >
              {t.nav[key]}
            </a>
          ))}
          <a
            href="https://github.com/FabianBarua/react-reel-roulette"
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-full py-2 text-center text-[12.5px] font-medium text-(--md-on-surface-variant) transition hover:bg-(--md-surface-container-high)"
          >
            GitHub
          </a>
        </nav>
      </header>

      {/* hero */}
      <header className="mx-auto max-w-5xl px-5 pb-6 pt-8 sm:pt-10">
        <div className="relative overflow-hidden rounded-[24px] bg-(--md-primary-container) px-5 py-8 text-center text-(--md-on-primary-container) sm:px-10 sm:py-11">
          {/* M3 decorative circles */}
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-(--md-on-primary-container)/[0.06]" />
          <div className="pointer-events-none absolute -bottom-24 -right-12 h-72 w-72 rounded-full bg-(--md-on-primary-container)/[0.06]" />

          <a
            href="https://github.com/FabianBarua/react-reel-roulette"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-(--md-on-primary-container)/20 px-3.5 py-1.5 text-[12px] font-medium transition hover:bg-(--md-on-primary-container)/10"
          >
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            {t.hero.badge}
          </a>

          <h1 className="mx-auto mt-5 max-w-3xl text-[36px] font-normal leading-[1.08] tracking-[-0.01em] sm:text-[52px]">
            {t.hero.title1}
            <br />
            <span className="font-medium">{t.hero.title2}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed opacity-80">
            {t.hero.tagline}
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={copyInstall}
              className="inline-flex items-center gap-3 rounded-full border border-(--md-on-primary-container)/30 px-6 py-3 font-mono text-[13px] transition hover:bg-(--md-on-primary-container)/10 active:scale-[0.98]"
            >
              npm i react-reel-roulette
              <span className="text-[11px] opacity-60">{copied ? t.hero.copied : '⧉'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* live demo */}
      <div className="mx-auto max-w-5xl px-5">
        <ReelRoulette
          items={items}
          handleRef={rouletteRef}
          duration={duration}
          reelLength={reelLength}
          landingJitter={landingJitter}
          easing={EASINGS[easingKey]}
          itemWidth={itemWidth}
          itemWidthDesktop={itemWidthDesktop}
          height={height}
          heightDesktop={heightDesktop}
          accentColor={useAccent ? accent : undefined}
          card={{ variant: cardVariant, rarityStyle, showImage, showName, showSubtitle }}
          pointerVariant={pointerVariant}
        />

        <div className="mt-5 flex min-h-[88px] flex-col items-center gap-4">
          <button
            type="button"
            onClick={open}
            disabled={spinning || !items.length}
            className="rounded-full bg-(--md-primary) px-9 py-3.5 text-[14px] font-medium text-(--md-on-primary) shadow-sm transition-all duration-300 hover:shadow-md hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30 w-full sm:w-auto disabled:shadow-none"
          >
            {spinning ? t.demo.opening : t.demo.open}
          </button>

          {won && (
            <div
              className="animate-win-rise flex items-center gap-4 rounded-[20px] bg-(--md-surface-container) px-6 py-4"
              style={{ boxShadow: won.color ? `0 0 32px ${won.color}26` : undefined }}
            >
              {won.image && <img src={won.image} alt="" className="animate-float-y h-12 w-12 object-contain" />}
              <div className="text-left">
                <p className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-(--md-on-surface-variant)">
                  {won.color && <span className="inline-block h-[5px] w-[5px] rounded-full" style={{ background: won.color }} />}
                  {won.subtitle ?? t.demo.prize}
                </p>
                <p className="mt-0.5 text-[16px] font-medium">{won.name ?? won.id}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 pb-20 pt-14">
        {/* quick start */}
        <Section
          eyebrow={t.quickstart.eyebrow}
          title={t.quickstart.title}
          description={t.quickstart.description}
        >
          <Code copyLabel={t.code.copy} copiedLabel={t.code.copied}>{`import { useRef } from 'react'
import { ReelRoulette, type ReelRouletteHandle, type RouletteItem } from 'react-reel-roulette'

const prizes: RouletteItem[] = [
  { id: 'common', name: 'Dune Fragment', color: '#b0c3d9', weight: 80 },
  { id: 'rare',   name: 'Nova Prism',    color: '#eb4b4b', weight: 1 },
]

function MyPage() {
  const roulette = useRef<ReelRouletteHandle>(null)

  return (
    <>
      <ReelRoulette items={prizes} handleRef={roulette} />
      <button onClick={async () => {
        const prize = await roulette.current?.spin()
        console.log(prize) // → { id: 'common', ... }
      }}>
        Spin
      </button>
    </>
  )
}`}</Code>
          <div className="mt-5 rounded-[20px] bg-(--md-tertiary-container) p-5 text-[13.5px] leading-relaxed text-(--md-on-tertiary-container)">
            <strong className="font-semibold">{t.quickstart.securityTitle}</strong> {t.quickstart.securityBody1}
            <code className="font-mono text-[12px]">weight</code>
            {t.quickstart.securityBody2}
            <code className="font-mono text-[12px]">spin()</code>
            {t.quickstart.securityBody3}
            <Code copyLabel={t.code.copy} copiedLabel={t.code.copied}>{`const { prizeId } = await fetch('/api/spin', { method: 'POST' }).then(r => r.json())
const prize = await roulette.current?.spin(prizeId)   // shorthand: accepts the id directly`}</Code>
          </div>
        </Section>

        {/* items */}
        <Section
          id="items"
          eyebrow={t.items.eyebrow}
          title={t.items.title}
          description={t.items.description}
        >
          <DocTable headers={t.items.tableHeaders} rows={t.items.fields} />

          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{t.items.editTitle}</h3>
                <p className="mt-1 text-[13px] text-(--md-on-surface-variant)">
                  {t.items.editSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="rounded-full bg-(--md-secondary-container) px-5 py-2.5 text-[13px] font-medium text-(--md-on-secondary-container) transition hover:shadow-sm hover:brightness-105 active:scale-[0.98]"
              >
                {t.items.add}
              </button>
            </div>

            <div className="overflow-x-auto rounded-[20px] bg-(--md-surface-container-lowest)">
              <table className="w-full min-w-[640px] text-[13px]">
                <thead>
                  <tr className="bg-(--md-surface-container-high) text-left text-[12px] font-medium text-(--md-on-surface-variant)">
                    <th className="px-4 py-3 font-medium">{t.items.colColor}</th>
                    <th className="px-4 py-3 font-medium">{t.items.colName}</th>
                    <th className="px-4 py-3 font-medium">{t.items.colSubtitle}</th>
                    <th className="px-4 py-3 font-medium">{t.items.colWeight}</th>
                    <th className="px-4 py-3 font-medium">{t.items.colImage}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b border-(--md-outline-variant)/40 last:border-0">
                      <td className="px-4 py-2">
                        <input
                          type="color"
                          value={it.color ?? '#98989d'}
                          onChange={(e) => updateItem(it.id, { color: e.target.value })}
                          className="h-7 w-10 cursor-pointer rounded-lg border border-(--md-outline-variant) bg-transparent"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className={inputCls}
                          value={it.name ?? ''}
                          onChange={(e) => updateItem(it.id, { name: e.target.value || null })}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className={inputCls}
                          value={it.subtitle ?? ''}
                          onChange={(e) => updateItem(it.id, { subtitle: e.target.value || null })}
                        />
                      </td>
                      <td className="w-24 px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          className={inputCls}
                          value={it.weight ?? 1}
                          onChange={(e) => updateItem(it.id, { weight: e.target.value === '' ? null : +e.target.value })}
                        />
                      </td>
                      <td className="w-28 px-4 py-2">
                        <select
                          className={inputCls}
                          value={it.image ?? ''}
                          onChange={(e) => updateItem(it.id, { image: e.target.value || null })}
                        >
                          <option value="">{t.items.noImage}</option>
                          {ITEM_IMAGES.map((src, i) => (
                            <option key={src} value={src}>{t.items.imageLabel} {i + 1}</option>
                          ))}
                        </select>
                      </td>
                      <td className="w-12 px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          aria-label={t.items.delete}
                          className="text-[15px] text-(--md-outline) transition hover:text-red-500"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* playground */}
        <Section
          id="playground"
          eyebrow={t.playground.eyebrow}
          title={t.playground.title}
          description={t.playground.description}
        >
          <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <Control label={`${t.playground.duration} — ${(duration / 1000).toFixed(1)}s`}>
              <input type="range" min={2000} max={15000} step={500} value={duration} onChange={(e) => setDuration(+e.target.value)} />
            </Control>
            <Control label={`${t.playground.reel} — ${reelLength} ${t.playground.cells}`}>
              <input type="range" min={20} max={120} step={5} value={reelLength} onChange={(e) => setReelLength(+e.target.value)} />
            </Control>
            <Control label={`${t.playground.jitter} — ${landingJitter}`}>
              <input type="range" min={0} max={0.9} step={0.1} value={landingJitter} onChange={(e) => setLandingJitter(+e.target.value)} />
            </Control>

            <Control label={t.playground.easing}>
              <select className={inputCls} value={easingKey} onChange={(e) => setEasingKey(e.target.value as EasingKey)}>
                {Object.keys(EASINGS).map((k) => (
                  <option key={k} value={k}>
                    {k}
                    {k === 'easeOutSpin' ? ` · ${t.playground.default}` : ''}
                    {k === 'easeOutBackSoft' ? ` · ${t.playground.bounce}` : ''}
                  </option>
                ))}
              </select>
            </Control>
            <Control label={t.playground.cardType}>
              <select className={inputCls} value={cardVariant} onChange={(e) => setCardVariant(e.target.value as CardVariant)}>
                <option value="glass">glass</option>
                <option value="solid">solid</option>
                <option value="minimal">minimal</option>
              </select>
            </Control>
            <Control label={t.playground.rarityStyle}>
              <select className={inputCls} value={rarityStyle} onChange={(e) => setRarityStyle(e.target.value as CardRarityStyle)}>
                <option value="dot">dot</option>
                <option value="strip">strip</option>
                <option value="glow">glow</option>
                <option value="border">border</option>
                <option value="none">none</option>
              </select>
            </Control>

            <Control label={t.playground.pointer}>
              <select className={inputCls} value={pointerVariant} onChange={(e) => setPointerVariant(e.target.value as PointerVariant)}>
                <option value="frame">frame</option>
                <option value="arrow">arrow</option>
                <option value="line">line</option>
                <option value="none">none</option>
              </select>
            </Control>
            <Control label={t.playground.winner}>
              <select className={inputCls} value={forcedWinner} onChange={(e) => setForcedWinner(e.target.value)}>
                <option value="">{t.playground.randomWeight}</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.name ?? it.id}</option>
                ))}
              </select>
            </Control>
            <Control label={t.playground.accent}>
              <span className="flex h-[37px] items-center gap-2.5">
                <input type="checkbox" checked={useAccent} onChange={(e) => setUseAccent(e.target.checked)} />
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  disabled={!useAccent}
                  className="h-8 w-12 cursor-pointer rounded-lg border border-(--md-outline-variant) bg-transparent disabled:opacity-30"
                />
              </span>
            </Control>

            <Control label={`${t.playground.cardWidth} — ${itemWidth}px / ${itemWidthDesktop}px`}>
              <span className="flex h-[37px] items-center gap-3">
                <input type="range" min={72} max={180} step={4} value={itemWidth} onChange={(e) => setItemWidth(+e.target.value)} className="flex-1" />
                <input type="range" min={100} max={240} step={4} value={itemWidthDesktop} onChange={(e) => setItemWidthDesktop(+e.target.value)} className="flex-1" />
              </span>
            </Control>
            <Control label={`${t.playground.tapeHeight} — ${height}px / ${heightDesktop}px`}>
              <span className="flex h-[37px] items-center gap-3">
                <input type="range" min={96} max={220} step={4} value={height} onChange={(e) => setHeight(+e.target.value)} className="flex-1" />
                <input type="range" min={120} max={280} step={4} value={heightDesktop} onChange={(e) => setHeightDesktop(+e.target.value)} className="flex-1" />
              </span>
            </Control>
            <Control label={t.playground.cardInfo}>
              <span className="flex h-[37px] flex-wrap items-center gap-4 text-[12.5px] text-(--md-on-surface-variant)">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={showImage} onChange={(e) => setShowImage(e.target.checked)} /> {t.playground.image}
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} /> {t.playground.name}
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={showSubtitle} onChange={(e) => setShowSubtitle(e.target.checked)} /> {t.playground.subtitle}
                </label>
              </span>
            </Control>
          </div>

          <div className="mt-8">
            <Code copyLabel={t.code.copy} copiedLabel={t.code.copied}>{snippet}</Code>
          </div>
        </Section>

        {/* api */}
        <Section
          id="api"
          eyebrow={t.api.eyebrow}
          title={t.api.title}
          description={t.api.description}
        >
          <h3 className="mb-4 text-[15px] font-semibold tracking-[-0.01em]">{'<ReelRoulette />'}</h3>
          <DocTable headers={t.api.propsHeaders} rows={t.api.props} />

          <h3 className="mb-4 mt-12 text-[15px] font-semibold tracking-[-0.01em]">spin()</h3>
          <Code copyLabel={t.code.copy} copiedLabel={t.code.copied}>{`${t.api.spinComments.random}
const prize = await roulette.current?.spin()

${t.api.spinComments.backend}
await roulette.current?.spin('item-id')
await roulette.current?.spin({ winner: 'item-id' })

${t.api.spinComments.duration}
await roulette.current?.spin({ winner: 'item-id', duration: 4000 })

${t.api.spinComments.reset}
roulette.current?.reset()`}</Code>

          <h3 className="mb-4 mt-12 text-[15px] font-semibold tracking-[-0.01em]">{t.api.headlessTitle}</h3>
          <p className="mb-4 max-w-2xl text-[13.5px] leading-relaxed text-(--md-on-surface-variant)">
            {t.api.headlessBody1}
            <code className="font-mono text-[12px]">viewportRef</code>
            {t.api.headlessBody2}<code className="font-mono text-[12px]">overflow-hidden</code>
            {t.api.headlessBody3}<code className="font-mono text-[12px]">trackRef</code>
            {t.api.headlessBody4}
          </p>
          <Code copyLabel={t.code.copy} copiedLabel={t.code.copied}>{`const { reel, status, winner, isSpinning, spin, reset, trackRef, viewportRef } =
  useReelRoulette(prizes, { duration: 5000 })

return (
  <div ref={viewportRef} className="relative overflow-hidden">
    <div ref={trackRef} className="flex gap-2 will-change-transform">
      {reel.map((cell) => <MyCard key={cell.key} item={cell.item} won={cell.isWinner} />)}
    </div>
  </div>
)`}</Code>

          <h3 className="mb-4 mt-12 text-[15px] font-semibold tracking-[-0.01em]">{t.api.tailwindTitle}</h3>
          <p className="mb-4 max-w-2xl text-[13.5px] leading-relaxed text-(--md-on-surface-variant)">
            {t.api.tailwindBody}
          </p>
          <Code copyLabel={t.code.copy} copiedLabel={t.code.copied}>{`import 'react-reel-roulette/styles.css'`}</Code>
        </Section>
      </div>

      <footer className="py-10 text-center text-[12.5px] text-(--md-on-surface-variant)">
        react-reel-roulette · MIT ·{' '}
        <a
          href="https://github.com/FabianBarua/react-reel-roulette"
          target="_blank"
          rel="noreferrer"
          className="text-(--md-primary) transition hover:underline"
        >
          GitHub
        </a>
      </footer>
    </main>
  )
}

export default App
