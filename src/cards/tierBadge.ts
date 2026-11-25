// Original insignia-style tier badge: a rank patch (flat top, clipped corners,
// pointed bottom) with a star, the level drawn as single pen strokes, and a
// chevron; on the profile card a laurel wraps it, growing with the level.
// Patch coordinates: 0 0 40 48; with laurel the crest spans -10 -1 60 54.

export const SHIELD = 'M7 2H33L38 7V31L20 46L2 31V7Z'
export const BEVEL = 'M8.6 5.5H31.4L34.5 8.6V29.4L20 41.5L5.5 29.4V8.6Z'
const STAR =
  'M20 5.9L21.12 8.96L24.37 9.08L21.81 11.09L22.7 14.22L20 12.4L17.3 14.22L18.19 11.09L15.63 9.08L18.88 8.96Z'
const CHEVRON = 'M12 33.5L20 38.5L28 33.5'
// Shrinks a full-size glyph (y 13–33) into the band between star and chevron.
const GLYPH_FIT = 'translate(20 23.5) scale(.62) translate(-20 -23)'

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
  // Laurel strength: Bronze V → 1 leaf … Bronze I → 5; Master 6; unrated none.
  const laurel = tier === 0 ? 0 : tier === 31 ? 6 : 6 - Number(glyph)
  return { glyph: GLYPHS[glyph], colors: GROUPS[group], laurel }
}

// Left laurel branch, drawn from the stem's base; the right one is its mirror.
// Stems cross under the point.
const STEM = 'M25 52C8 50 -6 40 -6 22C-6 16 -4 11 -1 7'
const LEAF = 'M0 0C-2.6 -2 -2.6 -6 0 -8C2.6 -6 2.6 -2 0 0Z' // almond pointing up
const LEAVES: [number, number, number][] = [
  [11, 49.5, -85],
  [3, 45.5, -68],
  [-2.5, 39, -50],
  [-5.5, 31, -30],
  [-6, 23, -8],
  [-3.5, 13, 18],
]
const branch = (color: string, n: number) =>
  `<path class="stem" d="${STEM}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" pathLength="1" stroke-dasharray="${(
    0.12 +
    0.15 * n
  ).toFixed(2)} 1"/>` +
  LEAVES.slice(0, n)
    .map(
      ([x, y, a], i) =>
        `<g transform="translate(${x} ${y}) rotate(${a})"><path class="leaf" style="animation-delay:${(
          0.8 +
          i * 0.1
        ).toFixed(1)}s" d="${LEAF}" fill="${color}"/></g>`,
    )
    .join('')

// Markup to splice into a card SVG with the crest's top-left at (x, y), w wide.
// Ids are fixed: one badge per card. The finished crest is the default state;
// keyframes animate *from* hidden, so it is complete without CSS or with reduced motion.
// #badge has no transform attribute because the card's `svg>*` fade sets a CSS transform.
export const badgeSvg = (tier: number, x: number, y: number, w: number) => {
  const { glyph, colors, laurel } = badgeParts(tier)
  const k = w / 60
  const leaf = colors[0]
  const laurels = laurel
    ? `<g id="badge-laurel">${branch(
        leaf,
        laurel,
      )}<g transform="translate(40 0) scale(-1 1)">${branch(
        leaf,
        laurel,
      )}</g></g>`
    : ''
  return `<defs><linearGradient id="badge-fill" x1="0" y1="48" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${
    colors[0]
  }"/><stop offset="1" stop-color="${
    colors[1]
  }"/></linearGradient></defs><g id="badge"><g transform="translate(${
    x + 10 * k
  } ${
    y + k
  }) scale(${k})"><g id="badge-intro"><g id="badge-spin">${laurels}<g id="badge-pop"><path id="badge-shield" d="${SHIELD}" fill="url(#badge-fill)" stroke="url(#badge-fill)" stroke-width="2" stroke-linejoin="round" pathLength="1" stroke-dasharray="1"/><path id="badge-bevel" d="${BEVEL}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1" pathLength="1" stroke-dasharray="1"/><path id="badge-star" d="${STAR}" fill="#fff"/><path id="badge-glyph" transform="${GLYPH_FIT}" d="${glyph}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1"/><path id="badge-chevron" d="${CHEVRON}" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1"/></g></g></g></g></g>`
}

// Intro: patch outline traces → colour floods → laurel grows leaf by leaf →
// star pops → level is written → chevron → bounce. Then a coin-flip spin every 6s.
export const BADGE_CSS = `@keyframes badge-draw{from{stroke-dashoffset:1}}
@keyframes badge-fill{from{fill-opacity:0}}
@keyframes badge-leaf{from{transform:scale(0)}}
@keyframes badge-star{0%{transform:scale(0) rotate(-180deg)}70%{transform:scale(1.3) rotate(15deg)}}
@keyframes badge-pop{0%{transform:scale(1)}40%{transform:scale(1.25) rotate(-6deg)}70%{transform:scale(.94) rotate(3deg)}}
@keyframes badge-intro{from{transform:scaleX(0)}}
@keyframes badge-spin{0%,70%{transform:scaleX(1)}77%{transform:scaleX(0)}84%{transform:scaleX(-1)}91%{transform:scaleX(0)}98%,100%{transform:scaleX(1)}}
#badge-intro{transform-box:fill-box;transform-origin:center;animation:badge-intro .7s ease-out both}
#badge-spin{transform-box:fill-box;transform-origin:center;animation:badge-spin 6s ease-in-out infinite}
#badge-shield{animation:badge-draw .8s .2s ease-in-out both,badge-fill .4s .9s ease-out both}
#badge-laurel .stem{animation:badge-draw .7s .6s ease-out both}
#badge-laurel .leaf{transform-box:fill-box;transform-origin:50% 100%;animation:badge-leaf .35s cubic-bezier(.3,1.6,.5,1) both}
#badge-bevel{animation:badge-draw .6s 1.1s ease-in-out both}
#badge-star{transform-box:fill-box;transform-origin:center;animation:badge-star .5s 1.2s ease-out both}
#badge-glyph{animation:badge-draw .6s 1.4s ease-in-out both}
#badge-chevron{animation:badge-draw .3s 1.9s ease-out both}
#badge-pop{transform-box:fill-box;transform-origin:center;animation:badge-pop .6s 2.2s ease-out both}`
