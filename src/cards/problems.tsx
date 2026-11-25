import { generate } from '.'
import { themeMapping, tierMapping } from '../constants'
import type { ProblemStat, User } from '../types'
import * as d3 from 'd3'

const TIERS = [
  { name: 'Bronze', color: '#d6673b' },
  { name: 'Silver', color: '#5381a0' },
  { name: 'Gold', color: '#ffae35' },
  { name: 'Platinum', color: '#1cd690' },
  { name: 'Diamond', color: '#00b4fc' },
  { name: 'Ruby', color: '#ff0062' },
]

export const problemCard = async (params: {
  user: User
  stats: ProblemStat[]
  size: number
  isDark: boolean
}) => {
  const { user, stats, size, isDark } = params
  const scale = size / 200
  const { base, mantle, text, sub } = themeMapping.get(isDark)!
  const muted = isDark ? sub : '#526170'
  const border = isDark ? '#263747' : '#e4e9ee'
  const rated = stats
    .filter(({ level, solved }) => level > 0 && level < 31 && solved > 0)
    .sort((a, b) => b.level - a.level)
  const total = rated.reduce((sum, { solved }) => sum + solved, 0)
  const tiers = TIERS.map((tier, i) => ({
    ...tier,
    solved: rated
      .filter(({ level }) => Math.floor((level - 1) / 5) === i)
      .reduce((sum, { solved }) => sum + solved, 0),
  })).filter(({ solved }) => solved > 0)
  const arcs = d3
    .pie<ProblemStat>()
    .value(({ solved }) => solved)
    .sort(null)(rated)
  const arc = d3
    .arc<d3.PieArcDatum<ProblemStat>>()
    .innerRadius(42)
    .outerRadius(66)

  return await generate(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: 420 * scale,
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
        <span style={{ fontSize: 17 * scale, flexShrink: 0 }}>난이도 분포</span>
        <span
          style={{
            color: muted,
            fontSize: 11 * scale,
            width: 250 * scale,
            justifyContent: 'flex-end',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {user.handle}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20 * scale,
          height: 140 * scale,
        }}
      >
        <div
          style={{
            display: 'flex',
            position: 'relative',
            width: 140 * scale,
            height: 140 * scale,
            flexShrink: 0,
          }}
        >
          <svg
            width={140 * scale}
            height={140 * scale}
            viewBox="0 0 140 140"
            role="img"
            aria-label="난이도 분포"
          >
            <circle
              cx="70"
              cy="70"
              r="54"
              fill="none"
              stroke={mantle}
              strokeWidth="24"
            />
            <g transform="translate(70,70)">
              {arcs.map((slice) => (
                <path
                  key={slice.data.level}
                  d={arc(slice)!}
                  fill={TIERS[Math.floor((slice.data.level - 1) / 5)].color}
                  stroke={base}
                  strokeWidth="0.7"
                  aria-label={`${tierMapping.get(slice.data.level)!.name}: ${
                    slice.data.solved
                  }`}
                />
              ))}
            </g>
          </svg>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              left: 28 * scale,
              top: 28 * scale,
              width: 84 * scale,
              height: 84 * scale,
            }}
          >
            <span style={{ fontSize: (total >= 10000 ? 16 : 24) * scale }}>
              {total.toLocaleString('en-US')}
            </span>
            <span style={{ color: muted, fontSize: 10 * scale }}>
              해결한 문제
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 4 * scale,
            width: 228 * scale,
          }}
        >
          {tiers.length === 0 ? (
            <span style={{ color: muted }}>
              아직 해결한 난이도별 문제가 없어요
            </span>
          ) : (
            tiers.map(({ name, color, solved }) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: 228 * scale,
                  height: 20 * scale,
                  padding: `0 ${7 * scale}px`,
                  borderRadius: 5 * scale,
                  backgroundColor: mantle,
                }}
              >
                <div
                  style={{
                    width: 6 * scale,
                    height: 6 * scale,
                    borderRadius: 3 * scale,
                    backgroundColor: color,
                    marginRight: 7 * scale,
                  }}
                />
                <span style={{ flexGrow: 1 }}>{name}</span>
                <span style={{ width: 60 * scale, justifyContent: 'flex-end' }}>
                  {solved.toLocaleString('en-US')}
                </span>
                <span
                  style={{
                    width: 48 * scale,
                    justifyContent: 'flex-end',
                    fontSize: 10 * scale,
                    color: muted,
                  }}
                >
                  {`${((solved / total) * 100).toFixed(1)}%`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    size,
  )
}
