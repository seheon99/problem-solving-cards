// Original tier badge: a shield with the tier level drawn as single pen strokes,
// so the whole badge can be "drawn" with stroke-dashoffset. viewBox 0 0 40 48.

export const SHIELD =
  'M6 2H34A4 4 0 0 1 38 6V22C38 33.5 30.5 41 20 46C9.5 41 2 33.5 2 22V6A4 4 0 0 1 6 2Z'
export const BEVEL =
  'M8 6H32A2 2 0 0 1 34 8V22C34 31 28.5 37 20 41.5C11.5 37 6 31 6 22V8A2 2 0 0 1 8 6Z'

const GLYPHS: Record<string, string> = {
  dots: 'M14 23h.01M20 23h.01M26 23h.01',
  1: 'M16 17L21 13V33',
  2: 'M14.5 18C14.5 11 25.5 11 25.5 18C25.5 23.5 15 26 14.5 33H25.5',
  3: 'M14.5 13.5H25.5L19 21C24 20.5 26.5 24 26 27.5C25 33.5 16.5 34 14 29.5',
  4: 'M23 33V13L13.5 27H27',
  5: 'M25.5 13.5H15.5L14.5 22C17.5 19.5 26 19.5 26 26.5C26 33.5 16.5 34 14 29.5',
  M: 'M12 33V14L20 25L28 14V33',
}

// [bottom, top] gradient per group: unrated, bronze … ruby, master
const GROUPS: [string, string][] = [
  ['#9aa0a6', '#c4c8cc'],
  ['#a84a1f', '#e0804f'],
  ['#3f6987', '#6c9ab8'],
  ['#e8941c', '#ffc35c'],
  ['#14b8ad', '#3ee6a8'],
  ['#0093d6', '#5b8cff'],
  ['#e0006b', '#ff4fc8'],
  ['#7a5cff', '#e04bff'],
]

export const badgeParts = (tier: number) => {
  const group = tier === 0 ? 0 : tier === 31 ? 7 : Math.ceil(tier / 5)
  const glyph =
    tier === 0 ? 'dots' : tier === 31 ? 'M' : String(5 - ((tier - 1) % 5))
  return { glyph: GLYPHS[glyph], colors: GROUPS[group] }
}

// Markup to splice into a card SVG at (x, y), w wide. Ids are fixed: one badge per card.
// The finished badge is the default state; keyframes animate *from* hidden, so it
// is complete without CSS or with reduced motion.
// #badge has no transform attribute because the card's `svg>*` fade sets a CSS transform.
export const badgeSvg = (tier: number, x: number, y: number, w: number) => {
  const { glyph, colors } = badgeParts(tier)
  return `<defs><linearGradient id="badge-fill" x1="0" y1="48" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${
    colors[0]
  }"/><stop offset="1" stop-color="${
    colors[1]
  }"/></linearGradient></defs><g id="badge"><g transform="translate(${x} ${y}) scale(${
    w / 40
  })"><g id="badge-pop"><path id="badge-shield" d="${SHIELD}" fill="url(#badge-fill)" stroke="url(#badge-fill)" stroke-width="2" stroke-linejoin="round" pathLength="1" stroke-dasharray="1"/><path id="badge-bevel" d="${BEVEL}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1" pathLength="1" stroke-dasharray="1"/><path id="badge-glyph" d="${glyph}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1"/></g></g></g>`
}

// Timeline: outline traces (0.2s) → colour floods in → bevel → glyph is written → bounce.
export const BADGE_CSS = `@keyframes badge-draw{from{stroke-dashoffset:1}}
@keyframes badge-fill{from{fill-opacity:0}}
@keyframes badge-pop{0%{transform:scale(1)}40%{transform:scale(1.25) rotate(-6deg)}70%{transform:scale(.94) rotate(3deg)}}
#badge-shield{animation:badge-draw .8s .2s ease-in-out both,badge-fill .4s .9s ease-out both}
#badge-bevel{animation:badge-draw .6s 1.1s ease-in-out both}
#badge-glyph{animation:badge-draw .6s 1.3s ease-in-out both}
#badge-pop{transform-box:fill-box;transform-origin:center;animation:badge-pop .6s 1.9s ease-out both}`
