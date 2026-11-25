import { generate } from '.'
import { themeMapping, tierMapping } from '../constants'
import type { Activity, User } from '../types'

const WEEKS = 53
const CELL = 10
const STEP = 13
const FREEZE = '#7cc4ff'
// ponytail: each week column is tagged with a unique opacity (satori copies it
// onto the column's nodes) so CSS can pop columns in one after another.
const weekTag = (i: number) => String(0.9 + (i + 1) / 1000)
const TODAY_TAG = '0.899'

const iso = (d: Date) => d.toISOString().slice(0, 10)

// The grid ends on `today` (YYYY-MM-DD, solved.ac's day) and starts on the Sunday
// 52 weeks before that week's Sunday.
export const streakRange = (today: string) => {
  const end = new Date(`${today}T00:00:00Z`)
  const start = new Date(end)
  start.setUTCDate(end.getUTCDate() - end.getUTCDay() - (WEEKS - 1) * 7)
  return { from: iso(start), to: today }
}

// solved.ac counts days in KST
export const kstToday = (now = new Date()) =>
  iso(new Date(now.getTime() + 9 * 60 * 60 * 1000))

export const streakCard = async (params: {
  user: User
  activity: Activity
  today: string
  size: number
  isDark: boolean
}) => {
  const { user, activity, today, size, isDark } = params
  const scale = size / 200
  const { base, mantle, text, sub } = themeMapping.get(isDark)!
  const muted = isDark ? sub : '#526170'
  const border = isDark ? '#263747' : '#e4e9ee'
  const empty = isDark ? '#1e2b38' : '#ebedf0'

  const { from } = streakRange(today)
  const byDay = new Map(activity.days.map((d) => [d.day, d]))
  const start = new Date(`${from}T00:00:00Z`)
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(start)
      date.setUTCDate(start.getUTCDate() + w * 7 + d)
      const day = iso(date)
      return day > today ? null : { day, ...byDay.get(day) }
    }),
  )
  const inRange = activity.days.filter((d) => d.day >= from && d.day <= today)
  const solved = inRange.reduce((n, d) => n + d.solvedCount, 0)
  const active = inRange.filter((d) => d.solvedCount > 0).length

  const color = (level?: number, count?: number) =>
    !count ? empty : level ? tierMapping.get(level)?.color ?? muted : muted

  const stats: [string, string][] = [
    ['현재 스트릭', `${activity.currentStreak.toLocaleString('en-US')}일`],
    ['최장 스트릭', `${activity.maxStreak.toLocaleString('en-US')}일`],
    ['1년간 푼 문제', solved.toLocaleString('en-US')],
    ['활동일', `${active.toLocaleString('en-US')}일`],
  ]

  const svg = await generate(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: 720 * scale,
        height: size,
        padding: 15 * scale,
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
        <span style={{ fontSize: 17 * scale, flexShrink: 0 }}>스트릭</span>
        <span
          style={{
            color: muted,
            fontSize: 11 * scale,
            width: 560 * scale,
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
        {stats.map(([label, value]) => (
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
            <span style={{ fontSize: 13 * scale }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: (STEP - CELL) * scale }}>
        {weeks.map((week, w) => (
          <div
            key={w}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: (STEP - CELL) * scale,
              opacity: Number(weekTag(w)),
            }}
          >
            {week.map((cell, d) =>
              cell ? (
                <div
                  key={d}
                  style={{
                    display: 'flex',
                    width: CELL * scale,
                    height: CELL * scale,
                    borderRadius: 2.5 * scale,
                    backgroundColor: color(
                      cell.maxSolvedLevel,
                      cell.solvedCount,
                    ),
                    // satori throws on `border: undefined`, so only set it when used
                    ...(cell.freezeUsed
                      ? { border: `${1.2 * scale}px solid ${FREEZE}` }
                      : {}),
                    // today's square pulses; nested opacity multiplies with the week tag
                    ...(cell.day === today
                      ? { opacity: Number(TODAY_TAG) }
                      : {}),
                  }}
                />
              ) : (
                <div
                  key={d}
                  style={{
                    display: 'flex',
                    width: CELL * scale,
                    height: CELL * scale,
                  }}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </div>,
    size,
  )

  const todayTag = String(Number(weekTag(WEEKS - 1)) * Number(TODAY_TAG))
  const css = `<style>
@keyframes fade{from{opacity:0;transform:translateY(6px)}}
@keyframes cell{from{opacity:0;transform:scale(.3)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
svg>*{animation:fade .6s ease-out both}
${Array.from(
  { length: WEEKS },
  (_, i) =>
    `[opacity="${weekTag(
      i,
    )}"]{transform-box:fill-box;transform-origin:center;animation:cell .35s ${(
      0.2 +
      i * 0.025
    ).toFixed(3)}s cubic-bezier(.3,1.5,.5,1) both}`,
).join('\n')}
[opacity="${todayTag}"]{animation:cell .35s ${(
    0.2 +
    (WEEKS - 1) * 0.025
  ).toFixed(3)}s both,pulse 2s 2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>`
  return svg.replace(/^<svg[^>]*>/, (open) => open + css)
}
