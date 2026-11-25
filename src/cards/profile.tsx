import { generate } from '.'
import { classMapping, themeMapping, tierMapping } from '../constants'
import type { User } from '../types'
import { BADGE_CSS, badgeSvg } from './tierBadge'

// ponytail: satori can't emit animation, so CSS/SVG is spliced into its output.
// satori copies `opacity` onto every node it draws for an element (multiplying
// through nesting), so elements are tagged with unique opacities as CSS hooks.
// Tags near 1 are visually identical; tags near 0 stay hidden without CSS.
const FRAMES = 12
const frameTag = (i: number) => String((i + 1) / 1000) // count-up frames
const TAG = {
  rating: 0.999,
  bar: 0.997,
  tier: 0.995,
  tiles: [0.991, 0.992, 0.993, 0.994],
  flame: 0.98,
  shine: 0.021,
}
const flameTag = String(TAG.tiles[3] * TAG.flame)
const SHINE = 18 // shine band width
const DONE = 1.5 // count-up and bar finish here (s)

const animation = (o: {
  scale: number
  ring: string
  glow: boolean
  master: boolean
  travel: number
}) => {
  const s = o.scale
  return `<style>
@keyframes fade{from{opacity:0;transform:translateY(6px)}}
@keyframes grow{from{transform:scaleX(0)}}
@keyframes show{from,to{opacity:1}}
@keyframes hide{from,to{opacity:0}}
@keyframes pop{0%{opacity:0;transform:scale(.6)}70%{opacity:1;transform:scale(1.15)}}
@keyframes draw{from{stroke-dashoffset:1}}
@keyframes shine{0%{opacity:0;transform:none}20%{opacity:1}40%,100%{opacity:0;transform:translateX(${
    o.travel
  }px)}}
@keyframes flicker{0%,100%{transform:scale(1) rotate(0)}25%{transform:scale(1.08,.94) rotate(-4deg)}50%{transform:scale(.95,1.08) rotate(3deg)}75%{transform:scale(1.04,.98) rotate(-2deg)}}
svg>*{animation:fade .6s ease-out both}
[opacity="${
    TAG.bar
  }"]{transform-box:fill-box;transform-origin:left;animation:grow 1.2s .3s cubic-bezier(.2,.8,.2,1) both${
    o.master ? ';filter:url(#hue)' : ''
  }}
[opacity="${TAG.rating}"]{animation:hide ${DONE}s}
${Array.from(
  { length: FRAMES },
  (_, i) => `[opacity="${frameTag(i)}"]{animation:show .1s ${0.3 + i * 0.1}s}`,
).join('\n')}
[opacity="${
    TAG.tier
  }"]{transform-box:fill-box;transform-origin:center;animation:pop .5s ${DONE}s both}
${TAG.tiles
  .map(
    (t, i) =>
      `[opacity="${t}"]{animation:fade .4s ${DONE + 0.15 + i * 0.08}s both}`,
  )
  .join('\n')}
[opacity="${flameTag}"]{transform-box:fill-box;transform-origin:50% 90%;animation:fade .4s ${
    DONE + 0.39
  }s both,flicker 1.2s ${DONE + 0.8}s ease-in-out infinite}
[opacity="${TAG.shine}"]{animation:shine 4s ${DONE + 0.5}s ease-in-out infinite}
#ring{animation:draw 1.2s .3s cubic-bezier(.2,.8,.2,1) both${
    o.glow ? ';filter:url(#glow)' : ''
  }}
${BADGE_CSS}
@media (prefers-reduced-motion:reduce){*{animation:none!important;filter:none!important}}
</style><defs>
<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="${
    2 * s
  }" flood-color="${
    o.ring
  }"><animate attributeName="stdDeviation" values="${s};${
    4 * s
  };${s}" dur="2.5s" repeatCount="indefinite"/></feDropShadow></filter>
<filter id="hue"><feColorMatrix type="hueRotate" values="0"><animate attributeName="values" from="0" to="360" dur="6s" repeatCount="indefinite"/></feColorMatrix></filter>
</defs>`
}

// Ring traced over the avatar border; position follows the card's padding + border.
const ringRect = (s: number, color: string) =>
  `<rect id="ring" x="${14 * s}" y="${13 * s}" width="${74 * s}" height="${
    74 * s
  }" rx="${11 * s}" fill="none" stroke="${color}" stroke-width="${
    2 * s
  }" pathLength="1" stroke-dasharray="1"/>`

// Small flame for the streak tile (24x24 viewBox).
const FLAME =
  'M12 2c1 3.5 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.6 1.2 2.5 2.2 2.8C10.5 8.5 11 5 12 2z'

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
  const ring = isMaster ? '#b491ff' : data.tier === 0 ? border : tier.color
  const fillWidth = (246 * scale * progress) / 100
  const shine = fillWidth > 3 * SHINE * scale
  // solved.ac v4 can omit fields (live crash on rank/maxStreak); show a dash instead
  const fmt = (n?: number) => (n == null ? '–' : n.toLocaleString('en-US'))

  const stats: [string, string, string?][] = [
    ['푼 문제', fmt(data.solvedCount)],
    [
      '클래스',
      `${data.class}${plus}`,
      data.class ? classMapping.get(data.class) : muted,
    ],
    ['순위', data.rank == null ? '–' : `#${fmt(data.rank)}`],
    ['스트릭', data.maxStreak == null ? '–' : `${fmt(data.maxStreak)}일`],
  ]

  const avatar = {
    width: 76 * scale,
    height: 76 * scale,
    flexShrink: 0,
    borderRadius: 12 * scale,
    border: `${2 * scale}px solid transparent`,
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
          <span
            style={{
              fontSize: 11 * scale,
              flexShrink: 0,
              opacity: TAG.tier,
              ...accent,
            }}
          >
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
              <span
                style={{ fontSize: 18 * scale, opacity: TAG.rating, ...accent }}
              >
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
                      opacity: Number(frameTag(i)),
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
              position: 'relative',
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
                  opacity: TAG.bar,
                }}
              />
            )}
            {shine && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: SHINE * scale,
                  height: 5 * scale,
                  borderRadius: 3 * scale,
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  opacity: TAG.shine,
                }}
              />
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 * scale }}>
          {stats.map(([label, value, color], i) => (
            <div
              key={label}
              style={{
                position: 'relative',
                opacity: TAG.tiles[i],
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
              {i === 3 && (data.maxStreak ?? 0) > 0 && (
                <svg
                  width={8 * scale}
                  height={8 * scale}
                  viewBox="0 0 24 24"
                  style={{
                    position: 'absolute',
                    top: 2 * scale,
                    right: 3 * scale,
                    opacity: TAG.flame,
                  }}
                >
                  <path d={FLAME} fill="#ff8a00" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>,
    size,
  )
  const css = animation({
    scale,
    ring,
    glow: data.tier >= 21, // Diamond and up
    master: isMaster,
    travel: fillWidth - SHINE * scale,
  })
  return svg
    .replace(/^<svg[^>]*>/, (open) => open + css)
    .replace(
      /<\/svg>$/,
      ringRect(scale, ring) +
        badgeSvg(data.tier, 60 * scale, 62 * scale, 34 * scale) +
        '</svg>',
    )
}
