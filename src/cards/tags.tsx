import { generate } from '.'
import { themeMapping, tierMapping } from '../constants'
import type { TagRatingStat, User } from '../types'
import { tagIcons } from './tagIcons'

const TAGS = ['math', 'impl', 'greedy', 'string', 'ds', 'graph', 'dp', 'geom']
const tiers = [...tierMapping.entries()].reverse()

export const tagCard = async (params: {
  user: User
  stats: TagRatingStat[]
  size: number
  isDark: boolean
  top: boolean
  text: boolean
}) => {
  const { user, stats, size, isDark, top } = params
  const scale = size / 200
  const { base, mantle, text, sub } = themeMapping.get(isDark)!
  const muted = isDark ? sub : '#526170'
  const sorted = [...stats].sort((a, b) => b.rating - a.rating)
  const primary = top ? sorted.slice(0, 8).map(({ tag }) => tag.key) : TAGS
  const secondary = sorted
    .filter(({ tag }) => !primary.includes(tag.key))
    .slice(0, 7)
  const best = sorted[0]?.rating ?? 0
  const border = isDark ? '#263747' : '#e4e9ee'

  const ratingTier = (rating: number) =>
    tiers.find(([, tier]) => rating >= tier.rating) ?? tiers[tiers.length - 1]

  const badge = (rating: number) => {
    const [level, tier] = ratingTier(rating)
    return (
      <svg
        width={12 * scale}
        height={16 * scale}
        viewBox="0 0 12 16"
        aria-label={tier.name}
      >
        <path d="M1 1h10v10l-5 4-5-4z" fill={level === 0 ? sub : tier.color} />
        {level > 0 && (
          <path
            d={Array.from(
              { length: level === 31 ? 1 : 5 - ((level - 1) % 5) },
              (_, i) => `M4 ${4 + i * 1.5}h4`,
            ).join(' ')}
            fill="none"
            stroke={base}
            strokeWidth="0.8"
          />
        )}
      </svg>
    )
  }

  return await generate(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: 704 * scale,
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
        <span style={{ fontSize: 17 * scale, flexShrink: 0 }}>태그</span>
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
        {primary.map((key) => {
          const rating = stats.find(({ tag }) => tag.key === key)?.rating ?? 0
          const [level, tier] = ratingTier(rating)
          const isBest = rating > 0 && rating === best
          const accent = isBest && level > 0 ? tier.color : muted

          return (
            <div
              key={key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5 * scale,
                width: 77 * scale,
                height: 78 * scale,
                flexShrink: 0,
                borderRadius: 10 * scale,
                border: `${scale}px solid ${isBest ? accent : border}`,
                backgroundColor: isBest ? `${accent}18` : mantle,
              }}
            >
              <svg
                width={19 * scale}
                height={19 * scale}
                viewBox="0 0 24 24"
                fill="none"
                stroke={accent}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {(
                  tagIcons[key] ?? ['M7 7l-5 5 5 5M17 7l5 5-5 5M14 4l-4 16']
                ).map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
              <span
                style={{
                  width: 69 * scale,
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: 11 * scale,
                }}
              >
                {key}
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5 * scale,
                }}
              >
                {badge(rating)}
                <span
                  style={{
                    fontSize: 15 * scale,
                    color: text,
                  }}
                >
                  {rating.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          gap: 6 * scale,
          height: 48 * scale,
        }}
      >
        {secondary.map(({ tag, rating }) => (
          <div
            key={tag.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: 162 * scale,
              height: 21 * scale,
              padding: `0 ${7 * scale}px`,
              borderRadius: 5 * scale,
              backgroundColor: mantle,
              border: `${scale}px solid ${
                rating > 0 && rating === best
                  ? ratingTier(rating)[1].color
                  : 'transparent'
              }`,
              color: muted,
              fontSize: 10 * scale,
            }}
          >
            <span
              style={{
                width: 100 * scale,
                flexShrink: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tag.key}
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                marginLeft: 6 * scale,
                gap: 4 * scale,
              }}
            >
              {badge(rating)}
              <span style={{ color: text }}>
                {rating.toLocaleString('en-US')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>,
    size,
  )
}
