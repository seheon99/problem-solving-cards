import { generate } from '.'
import { classMapping, themeMapping, tierMapping } from '../constants'
import type { User } from '../types'

// Count-up: satori draws text as paths and keeps `opacity`, so each frame of the
// rating is a stacked copy tagged with a unique near-invisible opacity that CSS
// flashes to 1 in turn. The real rating is tagged 0.999 and hidden until the end.
// Without CSS (or with reduced motion) only the real rating is visible.
const FRAMES = 12
const frameOpacity = (i: number) => String((i + 1) / 1000)

// ponytail: satori can't emit animation, so CSS is spliced into its output.
// The tier bar is the only element filled with a satori gradient pattern.
const ANIMATION = `<style>
@keyframes fade{from{opacity:0;transform:translateY(6px)}}
@keyframes grow{from{transform:scaleX(0)}}
svg>*{animation:fade .6s ease-out both}
[fill^="url(#satori_pattern"]{transform-box:fill-box;transform-origin:left;animation:grow 1.2s .3s cubic-bezier(.2,.8,.2,1) both}
@keyframes show{from,to{opacity:1}}
@keyframes hide{from,to{opacity:0}}
[opacity="0.999"]{animation:hide 1.5s}
${Array.from(
  { length: FRAMES },
  (_, i) =>
    `[opacity="${frameOpacity(i)}"]{animation:show .1s ${0.3 + i * 0.1}s}`,
).join('\n')}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>`

export const profileCard = async (params: {
  data: User
  size: number
  isDark: boolean
}) => {
  const { data, size, isDark } = params
  const scale = size / 100
  const { base, crust, mantle, text, sub } = themeMapping.get(isDark)!
  const muted = isDark ? sub : '#526170'
  const border = isDark ? '#263747' : '#e4e9ee'

  const tier = tierMapping.get(data.tier) ?? tierMapping.get(0)!
  const isMaster = data.tier === 31
  const next = isMaster ? undefined : tierMapping.get(data.tier + 1)
  const progress = next
    ? Math.min(
        100,
        Math.max(
          0,
          ((data.rating - tier.rating) / (next.rating - tier.rating)) * 100,
        ),
      )
    : 100
  // ponytail: satori doesn't clip gradient text reliably, so Master uses a solid colour
  const accent = {
    color: isMaster ? '#b491ff' : data.tier === 0 ? muted : tier.color,
  }
  const plus =
    data.classDecoration === 'gold'
      ? '++'
      : data.classDecoration === 'silver'
      ? '+'
      : ''
  const fmt = (n: number) => n.toLocaleString('en-US')

  const stats: [string, string, string?][] = [
    ['푼 문제', fmt(data.solvedCount)],
    [
      '클래스',
      `${data.class}${plus}`,
      data.class ? classMapping.get(data.class) : muted,
    ],
    ['순위', `#${fmt(data.rank)}`],
    ['스트릭', `${fmt(data.maxStreak)}일`],
  ]

  const avatar = {
    width: 76 * scale,
    height: 76 * scale,
    flexShrink: 0,
    borderRadius: 12 * scale,
    border: `${2 * scale}px solid ${isMaster ? '#b491ff' : tier.color}`,
  }

  const svg = await generate(
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12 * scale,
        width: 360 * scale,
        height: size,
        padding: 12 * scale,
        backgroundColor: base,
        border: `${scale}px solid ${border}`,
        borderRadius: 16 * scale,
        color: text,
        fontSize: 12 * scale,
      }}
    >
      {/* ponytail: profileImageUrl is a data URI, or null when static.solved.ac refuses us */}
      {data.profileImageUrl ? (
        <img src={data.profileImageUrl} style={avatar} />
      ) : (
        <div
          style={{
            ...avatar,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: mantle,
            color: muted,
            fontSize: 32 * scale,
          }}
        >
          {data.handle[0]?.toUpperCase()}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          // ponytail: fixed width; satori's flexGrow let Master content overflow the card
          width: 246 * scale,
          height: 76 * scale,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8 * scale,
          }}
        >
          <span
            style={{
              fontSize: 15 * scale,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.handle}
          </span>
          <span style={{ fontSize: 11 * scale, flexShrink: 0, ...accent }}>
            {tier.name}
          </span>
        </div>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 3 * scale }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', position: 'relative' }}>
              <span style={{ fontSize: 18 * scale, opacity: 0.999, ...accent }}>
                {fmt(data.rating)}
              </span>
              {data.rating > 0 &&
                Array.from({ length: FRAMES }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      position: 'absolute',
                      left: 0,
                      bottom: 0,
                      fontSize: 18 * scale,
                      opacity: Number(frameOpacity(i)),
                      ...accent,
                    }}
                  >
                    {/* ease-out cubic */}
                    {fmt(Math.round(data.rating * (1 - (1 - i / FRAMES) ** 3)))}
                  </span>
                ))}
            </div>
            <span style={{ fontSize: 9 * scale, color: muted }}>
              {next
                ? `${next.name}까지 ${fmt(next.rating - data.rating)}`
                : 'MAX'}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              height: 5 * scale,
              borderRadius: 3 * scale,
              backgroundColor: isDark ? crust : mantle,
            }}
          >
            {/* ponytail: satori emits NaN for a zero-width gradient */}
            {progress > 0 && (
              <div
                style={{
                  display: 'flex',
                  width: `${progress}%`,
                  borderRadius: 3 * scale,
                  backgroundImage: tier.gradient,
                }}
              />
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 * scale }}>
          {stats.map(([label, value, color]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                minWidth: 0,
                padding: `${2 * scale}px 0`,
                borderRadius: 5 * scale,
                backgroundColor: mantle,
              }}
            >
              <span style={{ fontSize: 8 * scale, color: muted }}>{label}</span>
              <span style={{ fontSize: 10 * scale, color: color ?? text }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    size,
  )
  return svg.replace(/^<svg[^>]*>/, (open) => open + ANIMATION)
}
