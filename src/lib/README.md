# ReelRoulette

Ruleta horizontal tipo reel con desaceleración realista. 100% agnóstica y reutilizable.
React 18+/19 + Tailwind CSS 4. Sin dependencias externas. Soporta **dark/light** de Tailwind.

## Quick start

Copiá la carpeta `ReelRoulette/` a tu proyecto y:

```tsx
import { useRef } from 'react'
import { ReelRoulette, type ReelRouletteHandle, type RouletteItem } from './ReelRoulette'

const prizes: RouletteItem[] = [
  { id: 'common', name: 'Sticker', subtitle: 'Common', image: '/sticker.png', color: '#b0c3d9', weight: 80 },
  { id: 'rare',   name: 'Knife',   subtitle: 'Rare',   image: '/knife.png',   color: '#eb4b4b', weight: 1 },
]

function MyPage() {
  const roulette = useRef<ReelRouletteHandle>(null)

  const open = async () => {
    const prize = await roulette.current?.spin() // ← Promise con el premio
    console.log('won:', prize)
  }

  return (
    <>
      <ReelRoulette items={prizes} handleRef={roulette} />
      <button onClick={open}>Spin</button>
    </>
  )
}
```

El ganador puede decidirse en tu backend: `roulette.current?.spin('rare')` (shorthand) o `spin({ winner: 'rare' })`.

> **Seguridad**: el sorteo client-side por `weight` es solo cosmético — cualquiera puede leerlo en el navegador. Si el premio vale algo real, decidilo en el servidor y pasale el id a `spin()`.

En `RouletteItem` solo `id` es requerido; `name`, `subtitle`, `image`, `color` y `weight` aceptan `null`, así que podés pasar la respuesta de tu API tal cual.

## Mecánica

1. Tira horizontal dentro de un viewport `overflow-hidden` con un marco de foco fijo en el centro.
2. Al girar se genera un reel largo de celdas aleatorias con el **ganador plantado cerca del final**.
3. Animación con `requestAnimationFrame` + `translate3d` y easing ease-out: arranca rápido, frena lento.
4. Aterriza con un **jitter aleatorio** dentro de la celda ganadora y luego "settle" (450 ms) hasta el centro exacto.
5. Cada giro relanza desde el inicio del reel nuevo, así **todos los giros se ven idénticos**.
6. El centrado se mide del DOM real (`offsetLeft`), y un `ResizeObserver` re-centra en resize. Funciona en mobile y desktop sin configurar nada.

## Dark / Light

Las cartas, el marco y los fades usan variantes `dark:` de Tailwind, así que siguen tu tema automáticamente
(clase `dark` en `<html>` o `prefers-color-scheme`). Si usás toggle por clase, agregá en tu CSS:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

## Props

| Prop | Default | Descripción |
|---|---|---|
| `items` | — | Lista de premios (`id`, `image`, `name`, `subtitle`, `color`, `weight`, `data`) |
| `handleRef` | — | Ref imperativa: `spin(options?) → Promise<premio>`, `reset()` |
| `onSpinStart` / `onSpinEnd` | — | Callbacks con el premio |
| `duration` | `7000` | Duración del giro (ms) |
| `reelLength` | `60` | Celdas generadas por giro |
| `winnerIndex` | `reelLength - 8` | Posición donde se planta el ganador |
| `landingJitter` | `0.4` | Aterrizaje aleatorio dentro de la celda (0 = siempre centrado) |
| `easing` | `easeOutSpin` | Curva (`easeOutQuint`, `easeOutExpo`, `easeOutBackSoft`…) |
| `itemWidth` / `itemWidthDesktop` | `112` / `144` | Ancho de carta (mobile / ≥sm) |
| `height` / `heightDesktop` | `128` / `166` | Alto del tape |
| `accentColor` | neutro adaptativo | Color del puntero (si se omite, sigue el tema) |
| `card` | `{}` | Carta built-in: `variant` (`'glass'`\|`'solid'`\|`'minimal'`), `rarityStyle` (`'dot'`\|`'strip'`\|`'glow'`\|`'border'`\|`'none'`), `showImage`/`showName`/`showSubtitle`, `className` |
| `pointerVariant` | `'frame'` | Puntero built-in: `'frame'` \| `'arrow'` \| `'line'` \| `'none'` |
| `pointer` | — | Nodo puntero 100% custom (pisa `pointerVariant`) |
| `renderItem` | carta default | Render custom de cada celda: `(cell, status) => ReactNode` |
| `classNames` | `{}` | Overrides de clases: `root`, `viewport`, `cell` |
| `hideEdgeFade` | `false` | Oculta los degradados laterales |
| `respectReducedMotion` | `true` | Salta la animación con `prefers-reduced-motion` |

## Headless (markup propio)

```tsx
const { reel, status, winner, spin, trackRef, viewportRef } = useReelRoulette(prizes, { duration: 5000 })
```

Adjuntá `viewportRef` al contenedor `overflow-hidden` y `trackRef` a la tira de celdas. El hook mide
el DOM (posición y ancho real de cada celda), así que cualquier tamaño/spacing responsive funciona.

## Notas de portabilidad

- Solo requiere React y Tailwind. Las clases `w-(--cell-w)` usan sintaxis Tailwind v4; en v3 usá `w-[var(--cell-w)]`.
- `RouletteItem<T>` es genérico: meté lo que necesites en `data` y tipalo en tu renderer custom.
