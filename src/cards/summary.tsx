import { generate } from '.'
import { themeMapping, tierMapping } from '../constants'
import type { User } from '../types'
import { tierIcon } from './tierIcon'

// The solved-count bonus formula solvedac-summary uses: round(200 * (1 - 0.997^n)).
// ponytail: solved.ac doesn't document its current formula and this one no longer
// matches every user (266 solved → 110 here, 122 from the API), so the card only
// trusts it when it reproduces the API's value. Swap in the real formula when known.
export const solvedBonus = (n: number) => Math.round(200 * (1 - 0.997 ** n))

// Problems still needed before the solved-count bonus goes up; null once it's maxed.
// Returns undefined when the formula disagrees with the API's current bonus.
export const problemsToNextBonus = (solved: number, apiBonus?: number) => {
  const now = solvedBonus(solved)
  if (apiBonus != null && apiBonus !== now) return undefined
  if (now >= 200) return null
  let n = 1
  while (solvedBonus(solved + n) === now) n++
  return n
}

// Points gained by solving one problem of each level: it replaces the lowest of the
// top 100 (level `cutoff`), so a level-n problem adds n - cutoff. Ten levels, hardest first.
export const earningPoints = (cutoff: number) => {
  const rows: { level: number; points: number }[] = []
  for (let n = Math.min(cutoff + 10, 30); n > cutoff; n--)
    rows.push({ level: n, points: n - cutoff })
  return rows
}

const MAX = { problems: 3000, class: 250, solved: 200 }
// ponytail: each bar gets a unique opacity tag (satori copies it onto the bar's nodes)
// so CSS can grow the bars one after another.
const barTag = (i: number) => String(0.95 + (i + 1) / 1000)

export const summaryCard = async (params: {
  user: User
  size: number
  isDark: boolean
}) => {
  const { user, size, isDark } = params
  const scale = size / 200
  const { base, crust, mantle, text, sub } = themeMapping.get(isDark)!
  const muted = isDark ? sub : '#526170'
  const border = isDark ? '#263747' : '#e4e9ee'
  const track = isDark ? crust : '#e9edf1'
  const fmt = (n: number) => n.toLocaleString('en-US')

  const tier = tierMapping.get(user.tier) ?? tierMapping.get(0)!
  const next = user.tier < 31 ? tierMapping.get(user.tier + 1) : undefined
  const progress = next
    ? Math.min(
        100,
        Math.max(
          0,
          ((user.rating - tier.rating) / (next.rating - tier.rating)) * 100,
        ),
      )
    : 100
  const toNext = problemsToNextBonus(user.solvedCount, user.ratingBySolvedCount)
  const cutoff = user.ratingProblemsCutoff ?? 0
  const earning = earningPoints(cutoff)
  let bars = 0

  const bar = (pct: number, fill: string, height = 5) => {
    const tag = Number(barTag(bars++))
    return (
      <div
        style={{
          display: 'flex',
          height: height * scale,
          borderRadius: height * scale,
          backgroundColor: track,
        }}
      >
        {/* satori emits NaN for a zero-width fill */}
        {pct > 0 && (
          <div
            style={{
              display: 'flex',
              width: `${Math.min(100, pct)}%`,
              borderRadius: height * scale,
              // satori throws on undefined style values, so set only the one used
              ...(fill.startsWith('linear')
                ? { backgroundImage: fill }
                : { backgroundColor: fill }),
              opacity: tag,
            }}
          />
        )}
      </div>
    )
  }

  const label = (t: string) => (
    <span style={{ fontSize: 11 * scale, color: muted }}>{t}</span>
  )

  const breakdown: [string, number, number, string?][] = [
    ['상위 100문제의 난이도 합', user.ratingByProblemsSum, MAX.problems],
    [`CLASS ${user.class}`, user.ratingByClass, MAX.class],
    [
      '문제수에 따른 보너스',
      user.ratingBySolvedCount,
      MAX.solved,
      toNext === undefined
        ? undefined
        : toNext === null
        ? '최대'
        : `다음 점수까지 ${fmt(toNext)}문제`,
    ],
  ]

  const svg = await generate(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 720 * scale,
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
        <span style={{ fontSize: 17 * scale, flexShrink: 0 }}>레이팅 요약</span>
        <span
          style={{
            color: muted,
            fontSize: 11 * scale,
            width: 500 * scale,
            justifyContent: 'flex-end',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {user.handle}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10 * scale, flexGrow: 1 }}>
        {/* next tier */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 180 * scale,
            padding: 10 * scale,
            borderRadius: 10 * scale,
            backgroundColor: mantle,
          }}
        >
          {label('다음 티어')}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6 * scale }}
          >
            {tierIcon(
              next ? user.tier + 1 : 31,
              (next ?? tier).name,
              scale * 1.6,
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: 24 * scale,
                  color: next ? next.color : tier.color,
                }}
              >
                {next ? `+${fmt(next.rating - user.rating)}` : 'MAX'}
              </span>
              <span style={{ fontSize: 10 * scale, color: muted }}>
                {next ? `${next.name}까지` : `${tier.name} 달성`}
              </span>
            </div>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 4 * scale }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10 * scale,
              }}
            >
              <span style={{ color: tier.color }}>{tier.name}</span>
              <span>{fmt(user.rating)}</span>
            </div>
            {bar(progress, tier.gradient, 6)}
          </div>
        </div>
        {/* rating breakdown */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 230 * scale,
            padding: 10 * scale,
            borderRadius: 10 * scale,
            backgroundColor: mantle,
          }}
        >
          {label('레이팅 구성')}
          {breakdown.map(([name, value, max, note]) => (
            <div
              key={name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3 * scale,
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
                <span>{name}</span>
                <span style={{ fontSize: 12 * scale }}>{`+${fmt(value)}`}</span>
              </div>
              {bar((value / max) * 100, tier.color)}
              {note && (
                <span style={{ fontSize: 8.5 * scale, color: muted }}>
                  {note}
                </span>
              )}
            </div>
          ))}
        </div>
        {/* points per level */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            gap: 4 * scale,
            padding: 10 * scale,
            borderRadius: 10 * scale,
            backgroundColor: mantle,
          }}
        >
          {label('난이도 별 얻게 될 점수')}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexWrap: 'wrap',
              columnGap: 10 * scale,
              rowGap: 3 * scale,
              height: 104 * scale,
            }}
          >
            {earning.map(({ level, points }) => {
              const t = tierMapping.get(level)!
              const mine = level === user.tier
              return (
                <div
                  key={level}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4 * scale,
                    width: 108 * scale,
                    height: 18 * scale,
                    fontSize: 9.5 * scale,
                    color: mine ? text : muted,
                  }}
                >
                  {tierIcon(level, t.name, scale * 0.85)}
                  <span
                    style={{
                      width: 58 * scale,
                      whiteSpace: 'nowrap',
                      color: mine ? t.color : undefined,
                    }}
                  >
                    {t.name}
                  </span>
                  <span style={{ color: text }}>{`+${points}`}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>,
    size,
  )

  const css = `<style>
@keyframes fade{from{opacity:0;transform:translateY(6px)}}
@keyframes grow{from{transform:scaleX(0)}}
svg>*{animation:fade .6s ease-out both}
${Array.from(
  { length: bars },
  (_, i) =>
    `[opacity="${barTag(
      i,
    )}"]{transform-box:fill-box;transform-origin:left;animation:grow 1s ${(
      0.3 +
      i * 0.12
    ).toFixed(2)}s cubic-bezier(.2,.8,.2,1) both}`,
).join('\n')}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>`
  return svg.replace(/^<svg[^>]*>/, (open) => open + css)
}
