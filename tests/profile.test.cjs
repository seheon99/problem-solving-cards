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

test('animates the card and tier bar', async () => {
  const svg = await profileCard({ data: user, size: 100, isDark: true })
  assert.match(svg, /^<svg[^>]*><style>/)
  assert.ok(svg.includes('[fill^="url(#satori_pattern"]'))
  assert.match(svg, /<path[^>]*fill="url\(#satori_pattern/)
})

test('shows the profile image, or the handle initial without one', async (t) => {
  const img = 'data:image/png;base64,iVBORw0KGgo='
  const renderer = require('../src/cards')
  t.mock.method(renderer, 'generate', async (el) => JSON.stringify(el))
  assert.ok(
    (
      await profileCard({
        data: { ...user, profileImageUrl: img },
        size: 100,
        isDark: true,
      })
    ).includes(img),
  )
  assert.ok(
    (await profileCard({ data: user, size: 100, isDark: true })).includes(
      '"children":"S"',
    ),
  )
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
