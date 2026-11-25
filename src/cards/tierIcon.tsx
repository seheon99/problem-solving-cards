import { BEVEL, SHIELD, badgeParts } from './tierBadge'

// Small static tier shield (no laurel) for inline use in satori layouts.
// Satori embeds each inline <svg> as its own image, so the gradient id can't collide.
export const tierIcon = (level: number, name: string, scale: number) => {
  const { glyph, colors } = badgeParts(level)
  return (
    <svg
      width={13 * scale}
      height={16 * scale}
      viewBox="0 0 40 48"
      aria-label={name}
    >
      <defs>
        <linearGradient
          id="g"
          x1="0"
          y1="48"
          x2="0"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={colors[0]} />
          <stop offset="1" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      <path d={SHIELD} fill="url(#g)" />
      <path
        d={BEVEL}
        fill="none"
        stroke="#fff"
        strokeOpacity=".35"
        strokeWidth="1"
      />
      <path
        d={glyph}
        fill="none"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
