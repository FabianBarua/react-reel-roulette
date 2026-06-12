# react-reel-roulette

Horizontal reel roulette for React + Tailwind CSS. Realistic deceleration, headless hook, dark/light ready, zero runtime dependencies.

[Live demo](https://fabianbarua.github.io/react-reel-roulette/) · [GitHub](https://github.com/FabianBarua/react-reel-roulette) · [npm](https://www.npmjs.com/package/react-reel-roulette)

## Install

```bash
npm i react-reel-roulette
# or
pnpm add react-reel-roulette
```

**Peer dependencies:** React 18+. Styles are precompiled and bundled — no Tailwind setup required in your app.

### Styles

The package auto-imports its own precompiled CSS (`dist/styles.css`), so the component works out of the box with any bundler that handles CSS imports (Vite, Next.js, webpack, etc.).

If your setup strips CSS imports from `node_modules`, import it manually:

```ts
import 'react-reel-roulette/styles.css'
```

If you use Tailwind 4 and prefer generating the utilities yourself (e.g. to dedupe with your own CSS), you can instead add the package to your scan path:

```css
@import "tailwindcss";
@source "../node_modules/react-reel-roulette";
```

## Quick start

```tsx
import { useRef } from 'react'
import {
  ReelRoulette,
  type ReelRouletteHandle,
  type RouletteItem,
} from 'react-reel-roulette'

const prizes: RouletteItem[] = [
  { id: 'common', name: 'Dune Fragment', subtitle: 'Common', color: '#b0c3d9', weight: 80 },
  { id: 'rare', name: 'Nova Prism', subtitle: 'Rare', color: '#eb4b4b', weight: 1 },
]

export function PrizeWheel() {
  const roulette = useRef<ReelRouletteHandle>(null)

  const spin = async () => {
    const prize = await roulette.current?.spin()
    console.log('won:', prize)
  }

  return (
    <>
      <ReelRoulette items={prizes} handleRef={roulette} />
      <button type="button" onClick={spin}>
        Spin
      </button>
    </>
  )
}
```

### Winner from your backend

```ts
// shorthand — pass the id directly
await roulette.current?.spin('rare')

// or explicit
await roulette.current?.spin({ winner: 'rare' })
```

> **Security:** client-side selection by `weight` is cosmetic only — anyone can read it in the browser. If the prize has real value, decide it on your server and pass the id to `spin()`. The animation is identical.

In `RouletteItem`, only `id` is required. `name`, `subtitle`, `image`, `color`, and `weight` accept `null`, so you can pass your API response as-is.

## How it works

1. Horizontal tape inside an `overflow-hidden` viewport with a fixed center pointer.
2. Each spin builds a long reel of random cells with the **winner planted near the end**.
3. `requestAnimationFrame` + `translate3d` with ease-out easing: fast start, slow stop.
4. Lands with random **jitter** inside the winning cell, then settles (~450 ms) to exact center.
5. Every spin starts from the head of a fresh reel, so **all spins look the same**.
6. Centering uses real DOM measurements (`offsetLeft`); `ResizeObserver` re-centers on resize.

## API (summary)

| Prop | Default | Description |
|---|---|---|
| `items` | — | `RouletteItem[]` prize list |
| `handleRef` | — | Imperative ref: `spin()` → `Promise<RouletteItem \| null>`, `reset()` |
| `onSpinStart` / `onSpinEnd` | — | Callbacks with the prize |
| `duration` | `7000` | Spin duration (ms) |
| `reelLength` | `60` | Cells generated per spin |
| `winnerIndex` | `reelLength - 8` | Cell index where the winner is planted |
| `landingJitter` | `0.4` | Random landing inside the cell (0 = dead center) |
| `easing` | `easeOutSpin` | Deceleration curve |
| `itemWidth` / `itemWidthDesktop` | `112` / `144` | Card width (mobile / ≥sm) |
| `height` / `heightDesktop` | `128` / `166` | Tape height |
| `accentColor` | adaptive | Pointer color; omitted = follows theme |
| `card` | `{}` | Built-in card: `variant`, `rarityStyle`, `showImage`/`showName`/`showSubtitle` |
| `pointerVariant` | `'frame'` | `'frame'` \| `'arrow'` \| `'line'` \| `'none'` |
| `pointer` | — | Custom pointer node (overrides `pointerVariant`) |
| `renderItem` | default card | `(cell, status) => ReactNode` |
| `classNames` | `{}` | `root`, `viewport`, `cell` |
| `hideEdgeFade` | `false` | Hide lateral fade gradients |
| `respectReducedMotion` | `true` | Skip animation when `prefers-reduced-motion` |

### Headless

```tsx
import { useReelRoulette } from 'react-reel-roulette'

const { reel, status, winner, spin, trackRef, viewportRef } = useReelRoulette(prizes, {
  duration: 5000,
})
```

Attach `viewportRef` to the `overflow-hidden` container and `trackRef` to the cell strip. The hook measures real DOM positions, so any responsive layout works.

### Exported utilities

`useReelRoulette`, `ReelRoulette`, `RouletteItemCard`, `easeOutSpin`, `easeOutQuint`, `easeOutCubic`, `easeOutExpo`, `easeOutBackSoft`, and all TypeScript types.

## Develop this repo

```bash
git clone https://github.com/FabianBarua/react-reel-roulette.git
cd react-reel-roulette
pnpm install
pnpm dev          # docs / playground at localhost:5173
pnpm build:lib    # output → dist/
pnpm build        # docs site → docs-dist/
pnpm lint
```

## GitHub Pages (live demo)

1. Push this repo to `main`.
2. On GitHub: **Settings → Pages → Build and deployment → Source** → choose **GitHub Actions** (not “Deploy from branch”).
3. The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) builds with `GITHUB_PAGES=true` and deploys `docs-dist/`.
4. After the first successful run, the site is at **https://fabianbarua.github.io/react-reel-roulette/**

Leave **Enforce HTTPS** enabled.

## Publish to npm

One-time setup:

1. Create an account at [npmjs.com](https://www.npmjs.com/signup) if you don't have one.
2. Log in locally:

   ```bash
   npm login
   ```

3. Confirm the package name is free (or bump `version` in `package.json` for updates):

   ```bash
   npm view react-reel-roulette version
   ```

Publish:

```bash
pnpm build:lib    # builds dist/ + .d.ts (also runs automatically via prepublishOnly)
npm publish       # use --access public if the name is scoped, e.g. @user/pkg
```

Checklist before publishing:

- [ ] `version` in `package.json` is correct (semver).
- [ ] `pnpm build:lib` succeeds and `dist/` contains `index.js` + `index.d.ts`.
- [ ] You are logged in as the owner of the package name (`npm whoami`).
- [ ] For a **first publish**, the name `react-reel-roulette` must not be taken by another user.

After publish, consumers install with `npm i react-reel-roulette`.

To release a fix:

```bash
# bump version in package.json (e.g. 0.1.0 → 0.1.1)
pnpm build:lib
npm publish
```

## License

MIT © [Fabian Barua](https://github.com/FabianBarua)
