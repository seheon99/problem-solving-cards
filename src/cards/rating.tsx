import { generate } from '.'
import { themeMapping, tierMapping } from '../constants'
import type { RatingPoint, User } from '../types'

// Chart box inside the card, in card units (scaled by size/200). Spliced in as raw SVG
// after satori lays out the header, so its position is fixed here.
const BOX = { x: 16, y: 78, w: 528, h: 106 }
const DAY = 24 * 60 * 60 * 1000
const tiers = [...tierMapping.entries()].filter(([level]) => level > 0)

const tierOf = (rating: number) =>
  [...tiers].reverse().find(([, t]) => rating >= t.rating)?.[1] ??
  tierMapping.get(0)!

// Step line (rating holds until the next change) through history, extended to today.
export const chartPath = (
  history: RatingPoint[],
  today: string,
  w: number,
  h: number,
) => {
  const end = Date.parse(today)
  const start = end - 365 * DAY
  const pts = history
    .filter((p) => Date.parse(p.day) <= end)
    .sort((a, b) => a.day.localeCompare(b.day))
  const values = pts.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max(20, (max - min) * 0.15)
  const lo = Math.max(0, min - pad)
  const hi = max + pad
  const x = (day: string) =>
    (Math.max(0, Date.parse(day) - start) / (end - start)) * w
  const y = (v: number) => h - ((v - lo) / (hi - lo)) * h
  let d = ''
  pts.forEach((p, i) => {
    const px = x(p.day).toFixed(1)
    const py = y(p.value).toFixed(1)
    d += i === 0 ? `M${px} ${py}` : `H${px}V${py}`
  })
  d += `H${w}`
  return { d, y, lo, hi, endY: y(values[values.length - 1]) }
}

export const ratingCard = async (params: {
  user: User
  history: RatingPoint[]
  today: string
  size: number
  isDark: boolean
}) => {
  const { user, today, size, isDark } = params
  const scale = size / 200
  const { base, mantle, text, sub } = themeMapping.get(isDark)!
  const muted = isDark ? sub : '#526170'
  const border = isDark ? '#263747' : '#e4e9ee'

  // No history yet (or none in range): a flat line at the current rating.
  const history = params.history.length
    ? params.history
    : [{ day: today, value: user.rating }]
  const first = history[0].value
  const last = history[history.length - 1].value
  const best = Math.max(...history.map((p) => p.value))
  const delta = last - first
  const current = tierOf(last)
  const fmt = (n: number) => n.toLocaleString('en-US')

  const stats: [string, string, string][] = [
    ['현재', fmt(last), current.color],
    [
      '1년 변화',
      `${delta > 0 ? '+' : ''}${fmt(delta)}`,
      delta > 0 ? '#2fbf71' : delta < 0 ? '#ff5c5c' : muted,
    ],
    ['최고', fmt(best), tierOf(best).color],
  ]

  const svg = await generate(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 560 * scale,
        height: size,
        padding: 15 * scale,
        gap: 8 * scale,
        backgroundColor: base,
        border: `${scale}px solid ${border}`,
        borderRadius: 16 * scale,
        color: text,
        fontSize: 12 * scale,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 18 * scale,
        }}
      >
        <span style={{ fontSize: 17 * scale, flexShrink: 0 }}>레이팅</span>
        <span
          style={{
            color: muted,
            fontSize: 11 * scale,
            width: 400 * scale,
            justifyContent: 'flex-end',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {user.handle}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 * scale }}>
        {stats.map(([label, value, color]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6 * scale,
              padding: `${3 * scale}px ${8 * scale}px`,
              borderRadius: 6 * scale,
              backgroundColor: mantle,
            }}
          >
            <span style={{ fontSize: 10 * scale, color: muted }}>{label}</span>
            <span style={{ fontSize: 13 * scale, color }}>{value}</span>
          </div>
        ))}
      </div>
    </div>,
    size,
  )

  const { d, y, lo, hi, endY } = chartPath(history, today, BOX.w, BOX.h)
  const visible = tiers.filter(([level, t]) => {
    const next = tierMapping.get(level + 1)?.rating ?? Infinity
    return t.rating < hi && next > lo
  })
  const clampY = (v: number) => Math.min(BOX.h, Math.max(0, y(v)))
  const bands = visible
    .map(([level, t]) => {
      const top = clampY(tierMapping.get(level + 1)?.rating ?? hi)
      const bottom = clampY(t.rating)
      return `<rect class="band" x="0" y="${top.toFixed(1)}" width="${
        BOX.w
      }" height="${(bottom - top).toFixed(1)}" fill="${
        t.color
      }" fill-opacity=".09"/><line class="band" x1="0" x2="${
        BOX.w
      }" y1="${bottom.toFixed(1)}" y2="${bottom.toFixed(1)}" stroke="${
        t.color
      }" stroke-opacity=".25" stroke-dasharray="3 3"/>`
    })
    .join('')
  // Hard-edged vertical gradient: the line takes the colour of the tier band it is in.
  const stops = visible
    .flatMap(([level, t]) => {
      const top =
        (clampY(tierMapping.get(level + 1)?.rating ?? hi) / BOX.h) * 100
      const bottom = (clampY(t.rating) / BOX.h) * 100
      return [
        `<stop offset="${top.toFixed(2)}%" stop-color="${t.color}"/>`,
        `<stop offset="${bottom.toFixed(2)}%" stop-color="${t.color}"/>`,
      ]
    })
    .join('')
  const s = scale
  const chart = `<defs><linearGradient id="rating-line" x1="0" y1="0" x2="0" y2="${
    BOX.h
  }" gradientUnits="userSpaceOnUse">${stops}</linearGradient><linearGradient id="rating-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${
    current.color
  }" stop-opacity=".28"/><stop offset="1" stop-color="${
    current.color
  }" stop-opacity="0"/></linearGradient></defs><g id="chart" transform="translate(${
    BOX.x * s
  } ${BOX.y * s}) scale(${s})">${bands}<path id="rating-area-path" d="${d}V${
    BOX.h
  }H0Z" fill="url(#rating-area)"/><path id="rating-path" d="${d}" fill="none" stroke="url(#rating-line)" stroke-width="2" stroke-linejoin="round" pathLength="1" stroke-dasharray="1"/><circle id="rating-halo" cx="${
    BOX.w
  }" cy="${endY.toFixed(1)}" r="4" fill="${
    current.color
  }"/><circle id="rating-dot" cx="${BOX.w}" cy="${endY.toFixed(
    1,
  )}" r="3.5" fill="${current.color}" stroke="${base}" stroke-width="1.5"/></g>`

  const css = `<style>
@keyframes fade{from{opacity:0;transform:translateY(6px)}}
@keyframes draw{from{stroke-dashoffset:1}}
@keyframes show{from{opacity:0}}
@keyframes pop{0%{transform:scale(0)}70%{transform:scale(1.5)}}
@keyframes halo{0%{transform:scale(1);opacity:.6}100%{transform:scale(3.2);opacity:0}}
svg>*{animation:fade .6s ease-out both}
#chart{animation:none}
#chart .band{animation:show .6s .2s both}
#rating-path{animation:draw 1.6s .4s cubic-bezier(.4,0,.2,1) both}
#rating-area-path{animation:show .8s 1.4s both}
#rating-dot{transform-box:fill-box;transform-origin:center;animation:pop .4s 1.95s ease-out both}
#rating-halo{transform-box:fill-box;transform-origin:center;opacity:0;animation:halo 2s 2.2s ease-out infinite}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>`
  return svg
    .replace(/^<svg[^>]*>/, (open) => open + css)
    .replace(/<\/svg>$/, chart + '</svg>')
}
