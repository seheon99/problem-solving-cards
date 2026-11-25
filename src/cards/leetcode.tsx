import { generate } from '.'
import { themeMapping } from '../constants'
import type { LeetCodeDifficulty, LeetCodeStats } from '../types'

// LeetCode's own difficulty colours
export const LC_COLORS: Record<LeetCodeDifficulty, string> = {
  Easy: '#00b8a3',
  Medium: '#ffb800',
  Hard: '#ff375f',
}
const DIFFS: LeetCodeDifficulty[] = ['Easy', 'Medium', 'Hard']
const LABELS: Record<LeetCodeDifficulty, string> = {
  Easy: '쉬움',
  Medium: '보통',
  Hard: '어려움',
}

// Ring drawn as raw SVG after layout, so its box is fixed: card padding 15 + border 1,
// header 18 + gap 10 above the body.
const RING = { x: 16, y: 44, size: 132, r: 54, stroke: 10 }
const barTag = (i: number) => String(0.95 + (i + 1) / 1000)

// Arc lengths (percent of the circle) for each difficulty's share of solved problems,
// with a small gap between non-empty arcs.
export const ringArcs = (solved: LeetCodeStats['solved']) => {
  const parts = DIFFS.map((d) => ({ d, n: solved[d] })).filter((p) => p.n > 0)
  const sum = parts.reduce((a, p) => a + p.n, 0)
  const gap = parts.length > 1 ? 1.5 : 0
  let start = 0
  return parts.map(({ d, n }) => {
    const len = Math.max(0, (n / sum) * 100 - gap)
    const arc = { d, start, len }
    start += (n / sum) * 100
    return arc
  })
}

export const leetcodeCard = async (params: {
  stats: LeetCodeStats
  size: number
  isDark: boolean
}) => {
  const { stats, size, isDark } = params
  const scale = size / 200
  const { base, crust, mantle, text, sub } = themeMapping.get(isDark)!
  const muted = isDark ? sub : '#526170'
  const border = isDark ? '#263747' : '#e4e9ee'
  const track = isDark ? crust : '#e9edf1'
  const fmt = (n: number) => n.toLocaleString('en-US')
  const share = stats.total.All ? (stats.solved.All / stats.total.All) * 100 : 0

  const tiles: [string, string][] = [
    ['랭킹', stats.ranking ? `#${fmt(stats.ranking)}` : '–'],
    [
      '대회 레이팅',
      stats.contest ? fmt(Math.round(stats.contest.rating)) : '–',
    ],
    ['전체 문제 중', `${share.toFixed(1)}%`],
  ]

  const svg = await generate(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 560 * scale,
        height: size,
        padding: 15 * scale,
        gap: 10 * scale,
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
        <span style={{ fontSize: 17 * scale, flexShrink: 0 }}>LeetCode</span>
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
          {stats.username}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 14 * scale, flexGrow: 1 }}>
        {/* ring is spliced over this box; the total sits in its middle */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: RING.size * scale,
            height: RING.size * scale,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 26 * scale }}>{fmt(stats.solved.All)}</span>
          <span style={{ fontSize: 9.5 * scale, color: muted }}>
            {`/ ${fmt(stats.total.All)} 해결`}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 10 * scale,
            width: 210 * scale,
          }}
        >
          {DIFFS.map((d, i) => {
            const pct = stats.total[d]
              ? (stats.solved[d] / stats.total[d]) * 100
              : 0
            return (
              <div
                key={d}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4 * scale,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    fontSize: 10 * scale,
                  }}
                >
                  <span
                    style={{ color: LC_COLORS[d] }}
                  >{`${d} · ${LABELS[d]}`}</span>
                  <span style={{ color: muted }}>
                    <span style={{ color: text, fontSize: 12 * scale }}>
                      {fmt(stats.solved[d])}
                    </span>
                    {` / ${fmt(stats.total[d])}`}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    height: 6 * scale,
                    borderRadius: 6 * scale,
                    backgroundColor: track,
                  }}
                >
                  {/* satori emits NaN for a zero-width fill */}
                  {pct > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        // tiny shares stay visible
                        width: `${Math.max(pct, 2)}%`,
                        borderRadius: 6 * scale,
                        backgroundColor: LC_COLORS[d],
                        opacity: Number(barTag(i)),
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 6 * scale,
            flexGrow: 1,
          }}
        >
          {tiles.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: `${4 * scale}px ${8 * scale}px`,
                borderRadius: 6 * scale,
                backgroundColor: mantle,
              }}
            >
              <span style={{ fontSize: 8.5 * scale, color: muted }}>
                {label}
              </span>
              <span style={{ fontSize: 12 * scale }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    size,
  )

  const s = scale
  const c = RING.size / 2
  const arcs = ringArcs(stats.solved)
  const ring = `<g id="ring" transform="translate(${RING.x * s} ${
    RING.y * s
  }) scale(${s})"><circle cx="${c}" cy="${c}" r="${
    RING.r
  }" fill="none" stroke="${track}" stroke-width="${RING.stroke}"/>${arcs
    .map(
      ({ d, start, len }, i) =>
        `<circle class="arc arc${i}" cx="${c}" cy="${c}" r="${
          RING.r
        }" fill="none" stroke="${LC_COLORS[d]}" stroke-width="${
          RING.stroke
        }" stroke-linecap="round" pathLength="100" stroke-dasharray="${len.toFixed(
          2,
        )} 100" stroke-dashoffset="${(-start).toFixed(
          2,
        )}" transform="rotate(-90 ${c} ${c})"/>`,
    )
    .join('')}</g>`

  const css = `<style>
@keyframes fade{from{opacity:0;transform:translateY(6px)}}
@keyframes grow{from{transform:scaleX(0)}}
${arcs
  .map(
    ({ len }, i) =>
      `@keyframes arc${i}{from{stroke-dasharray:0 100}}.arc${i}{stroke-dasharray:${len.toFixed(
        2,
      )} 100;animation:arc${i} .7s ${(0.3 + i * 0.45).toFixed(
        2,
      )}s cubic-bezier(.4,0,.2,1) both}`,
  )
  .join('\n')}
svg>*{animation:fade .6s ease-out both}
#ring{animation:none}
${DIFFS.map(
  (_, i) =>
    `[opacity="${barTag(
      i,
    )}"]{transform-box:fill-box;transform-origin:left;animation:grow 1s ${(
      0.4 +
      i * 0.15
    ).toFixed(2)}s cubic-bezier(.2,.8,.2,1) both}`,
).join('\n')}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>`
  return svg
    .replace(/^<svg[^>]*>/, (open) => open + css)
    .replace(/<\/svg>$/, ring + '</svg>')
}
