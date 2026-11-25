/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- CommonJS test runner loads TypeScript through ts-node. */
const assert = require('node:assert/strict')
const { test } = require('node:test')
const { streakCard, streakRange, kstToday } = require('../src/cards/streak')
const { ratingCard, chartPath } = require('../src/cards/rating')

const user = { handle: 'seheon99', rating: 1511, tier: 15 }
const today = '2026-11-25' // a Wednesday

test('streak grid spans 53 weeks starting on a Sunday and ending today', () => {
  const { from, to } = streakRange(today)
  assert.equal(to, today)
  assert.equal(new Date(`${from}T00:00:00Z`).getUTCDay(), 0)
  const days = (Date.parse(to) - Date.parse(from)) / 864e5 + 1
  assert.equal(days, 52 * 7 + 4) // 52 full weeks + Sun..Wed
})

test('KST day rolls over at 15:00 UTC', () => {
  assert.equal(kstToday(new Date('2026-11-25T14:59:00Z')), '2026-11-25')
  assert.equal(kstToday(new Date('2026-11-25T15:00:00Z')), '2026-11-26')
})

const activity = {
  from: '2025-11-23',
  to: today,
  currentStreak: 3,
  maxStreak: 5,
  days: [
    {
      day: '2026-11-23',
      solvedCount: 2,
      maxSolvedLevel: 15,
      freezeUsed: false,
    },
    { day: '2026-11-24', solvedCount: 0, maxSolvedLevel: 0, freezeUsed: true },
    { day: today, solvedCount: 1, maxSolvedLevel: 0, freezeUsed: false },
    {
      day: '2024-01-01',
      solvedCount: 9,
      maxSolvedLevel: 30,
      freezeUsed: false,
    },
  ],
}

test('streak card renders, counts only in-range days, and every animation hook lands', async () => {
  for (const isDark of [true, false]) {
    for (const size of [200, 1000]) {
      const svg = await streakCard({ user, activity, today, size, isDark })
      assert.match(svg, /^<svg\b/)
      assert.ok(!svg.includes('NaN'))
      for (const [, t] of svg.matchAll(/\[opacity="([^"]+)"\]/g))
        assert.ok(svg.includes(` opacity="${t}"`), t)
    }
  }
  const renderer = require('../src/cards')
  const orig = renderer.generate
  renderer.generate = async (el) => JSON.stringify(el)
  try {
    const tree = await streakCard({
      user,
      activity,
      today,
      size: 200,
      isDark: true,
    })
    assert.ok(tree.includes('"3일"'))
    assert.ok(tree.includes('"5일"'))
    assert.ok(tree.includes('"children":"3"'), 'solved in range = 3, not 12')
  } finally {
    renderer.generate = orig
  }
})

test('streak card renders with no activity', async () => {
  const svg = await streakCard({
    user,
    activity: { ...activity, days: [], currentStreak: 0, maxStreak: 0 },
    today,
    size: 200,
    isDark: true,
  })
  assert.match(svg, /^<svg\b/)
})

test('rating chart is a step line ending at the right edge', () => {
  const history = [
    { day: '2026-06-01', value: 1400 },
    { day: '2026-01-01', value: 1300 },
    { day: '2026-11-01', value: 1511 },
  ]
  const { d, endY, y } = chartPath(history, today, 500, 100)
  assert.match(d, /^M[\d.]+ [\d.]+(H[\d.]+V[\d.]+)+H500$/)
  assert.equal(endY, y(1511))
  assert.ok(y(1511) < y(1300), 'higher rating sits higher')
})

test('rating card renders full, empty and single-point history', async () => {
  for (const history of [
    [
      { day: '2026-01-01', value: 1300 },
      { day: '2026-11-01', value: 1511 },
    ],
    [],
    [{ day: '2026-06-01', value: 1511 }],
  ]) {
    for (const isDark of [true, false]) {
      const svg = await ratingCard({ user, history, today, size: 200, isDark })
      assert.match(svg, /^<svg\b/)
      assert.ok(!/NaN|Infinity/.test(svg))
      for (const id of ['chart', 'rating-path', 'rating-dot'])
        assert.ok(svg.includes(`id="${id}"`), id)
    }
  }
})
