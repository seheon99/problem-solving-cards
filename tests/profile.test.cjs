/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- CommonJS test runner loads TypeScript through ts-node. */
const assert = require('node:assert/strict')
const { test } = require('node:test')
const { profileCard } = require('../src/cards/profile')

const user = {
  handle: 'seheon99',
  profileImageUrl: null,
  solvedCount: 1234,
  tier: 16,
  rating: 1650,
  class: 5,
  classDecoration: 'silver',
  rank: 4321,
  maxStreak: 42,
}

test('renders self-contained SVGs across tiers, themes and size limits', async () => {
  for (const data of [
    user,
    { ...user, tier: 0, rating: 0, class: 0, classDecoration: 'none' },
    { ...user, tier: 31, rating: 3100, classDecoration: 'gold' },
    { ...user, handle: 'W'.repeat(64) },
  ]) {
    for (const isDark of [true, false]) {
      for (const size of [100, 500]) {
        const svg = await profileCard({ data, size, isDark })
        assert.match(svg, /^<svg\b/)
        assert.ok(!svg.includes('NaN'), 'no NaN in layout')
      }
    }
  }
})

test('content stays inside the card for every tier', async () => {
  for (const data of [user, { ...user, tier: 31, rating: 3150 }]) {
    const svg = await profileCard({ data, size: 200, isDark: false })
    const widths = [
      ...svg.matchAll(/<rect x="(\d+)" y="\d+" width="(\d+)"/g),
    ].map(([, x, w]) => +x + +w)
    assert.ok(Math.max(...widths) <= 720, `overflow ${Math.max(...widths)}`)
  }
})

test('every animation hook lands on a rendered element', async () => {
  const diamond = { ...user, tier: 21, rating: 2250, maxStreak: 42 }
  const svg = await profileCard({ data: diamond, size: 100, isDark: true })
  assert.match(svg, /^<svg[^>]*><style>/)
  const tags = [...svg.matchAll(/\[opacity="([^"]+)"\]/g)].map(([, t]) => t)
  assert.ok(tags.length >= 12 + 8)
  for (const t of tags)
    assert.match(svg, new RegExp(`<(path|g|rect|image)[^>]* opacity="${t}"`), t)
  assert.ok(!svg.includes('id="ring"'), 'no avatar ring')
  assert.ok(
    svg.includes('#badge-shield{filter:url(#glow)}'),
    'diamond crest glows',
  )
  for (const id of ['badge', 'badge-pop', 'badge-shield', 'badge-glyph'])
    assert.ok(svg.includes(`id="${id}"`), id)
  assert.match(svg, /<\/g><\/svg>$/)
  assert.ok(svg.includes('filter:url(#glow)'), 'diamond glows')
  assert.ok(!svg.includes('filter:url(#hue)'), 'only master shifts hue')
  const master = await profileCard({
    data: { ...user, tier: 31, rating: 3150 },
    size: 100,
    isDark: true,
  })
  assert.ok(master.includes('filter:url(#hue)'))
})

test('the crest fills the old avatar slot and stays inside the card', async () => {
  for (const tier of [0, 15, 31]) {
    const svg = await profileCard({
      data: { ...user, tier },
      size: 100,
      isDark: true,
    })
    const [, x, y, k] = svg.match(
      /<g id="badge"><g transform="translate\(([\d.]+) ([\d.]+)\) scale\(([\d.]+)\)"/,
    )
    // crest spans -10..50 x -1..53 in badge units around the translate point
    assert.ok(+x - 10 * k >= 12 && +x + 50 * k <= 90, `x fits slot (${tier})`)
    assert.ok(+y - k >= 0 && +y + 53 * k <= 100, `y fits card (${tier})`)
  }
})

test('rating counts up through tagged frames', async () => {
  const svg = await profileCard({ data: user, size: 100, isDark: true })
  assert.equal(
    (svg.match(/<path[^>]*opacity="0\.999"/g) || []).length > 0,
    true,
  )
  for (let i = 1; i <= 12; i++) {
    const tag = String(i / 1000)
    assert.ok(svg.includes(`opacity="${tag}"`), `frame ${tag} rendered`)
    assert.ok(
      svg.includes(`[opacity="${tag}"]{animation:show`),
      `frame ${tag} styled`,
    )
  }
  const unrated = await profileCard({
    data: { ...user, rating: 0, tier: 0 },
    size: 100,
    isDark: true,
  })
  assert.doesNotMatch(unrated, /<path[^>]*opacity="0.001"/)
})

test('tier badge shows the level within each tier group', () => {
  const { badgeParts } = require('../src/cards/tierBadge')
  const glyph = (t) => badgeParts(t).glyph
  assert.equal(glyph(1), glyph(6)) // Bronze V, Silver V
  assert.equal(glyph(5), glyph(30)) // Bronze I, Ruby I
  assert.notEqual(glyph(1), glyph(5))
  assert.notEqual(glyph(0), glyph(31))
  for (let t = 0; t <= 31; t++) {
    assert.ok(glyph(t), `glyph for ${t}`)
    assert.ok(badgeParts(t).colors, `colors for ${t}`)
  }
  assert.notDeepEqual(badgeParts(1).colors, badgeParts(6).colors)
})

test('laurel grows from level V to level I, Master largest, unrated none', () => {
  const { badgeParts } = require('../src/cards/tierBadge')
  const laurel = (t) => badgeParts(t).laurel
  assert.deepEqual([1, 2, 3, 4, 5].map(laurel), [1, 2, 3, 4, 5]) // Bronze V..I
  assert.equal(laurel(26), 1) // Ruby V
  assert.equal(laurel(0), 0)
  assert.ok(laurel(31) > laurel(30))
})

test('looping spin never collapses the badge at its loop boundary', () => {
  const { BADGE_CSS } = require('../src/cards/tierBadge')
  const spin = BADGE_CSS.match(/@keyframes badge-spin\{(.*?)\}\}/)[1]
  assert.match(spin, /^0%[^{]*\{transform:scaleX\(1\)/)
  assert.match(spin, /100%\{transform:scaleX\(1\)/)
})

test('renders when solved.ac omits optional numbers (live 500 regression)', async () => {
  const { rank, maxStreak, ...partial } = user
  void rank, maxStreak
  const svg = await profileCard({ data: partial, size: 100, isDark: true })
  assert.match(svg, /^<svg\b/)
})

test('a short handle is laid out at full width, not ellipsised', async (t) => {
  const satori = require('satori').default
  const { readFileSync } = require('node:fs')
  const { join } = require('node:path')
  const renderer = require('../src/cards')
  const widths = []
  t.mock.method(renderer, 'generate', (element, size) =>
    satori(element, {
      height: size,
      fonts: [
        {
          name: 'Pretendard-SemiBold',
          data: readFileSync(
            join(__dirname, '../fonts/Pretendard-SemiBold.otf'),
          ),
        },
      ],
      onNodeDetected: (node) => {
        if (node.type === 'span' && node.textContent === 'seheon99')
          widths.push(node.width)
      },
    }),
  )
  const svg = await profileCard({ data: user, size: 200, isDark: true })
  assert.match(svg, /^<svg width="720" height="200"/)
  assert.ok(widths[0] > 300, `handle box ${widths[0]}px`)
})
