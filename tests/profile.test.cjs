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
