/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- CommonJS test runner loads TypeScript through ts-node. */
const assert = require('node:assert/strict')
const { test } = require('node:test')
const {
  summaryCard,
  solvedBonus,
  problemsToNextBonus,
  earningPoints,
} = require('../src/cards/summary')

// From a live v4 response for seheon99
const user = {
  handle: 'seheon99',
  tier: 15,
  rating: 1511,
  ratingByProblemsSum: 1239,
  ratingByClass: 150,
  ratingBySolvedCount: 122,
  ratingProblemsCutoff: 10,
  solvedCount: 266,
  class: 4,
}

test('earning points: ten levels above the cutoff, hardest first', () => {
  const rows = earningPoints(10)
  assert.equal(rows.length, 10)
  assert.deepEqual(rows[0], { level: 20, points: 10 })
  assert.deepEqual(rows[9], { level: 11, points: 1 })
  assert.deepEqual(
    earningPoints(25).map((r) => r.level),
    [30, 29, 28, 27, 26],
  )
  assert.deepEqual(earningPoints(30), [])
})

test('problems to the next solved-count bonus match the formula', () => {
  const n = problemsToNextBonus(100)
  assert.ok(n >= 1)
  assert.equal(solvedBonus(100 + n - 1), solvedBonus(100))
  assert.ok(solvedBonus(100 + n) > solvedBonus(100))
  assert.equal(problemsToNextBonus(5000), null, 'maxed bonus')
})

test('next-bonus count is hidden when the formula disagrees with the API', () => {
  assert.equal(problemsToNextBonus(266, 122), undefined)
  assert.equal(
    problemsToNextBonus(266, solvedBonus(266)),
    problemsToNextBonus(266),
  )
})

test('summary card renders for normal, Master and brand-new users', async () => {
  for (const data of [
    user,
    { ...user, tier: 31, rating: 3100, ratingProblemsCutoff: 28 },
    {
      ...user,
      tier: 0,
      rating: 0,
      ratingByProblemsSum: 0,
      ratingByClass: 0,
      ratingBySolvedCount: 0,
      solvedCount: 0,
      ratingProblemsCutoff: 0,
      class: 0,
    },
  ]) {
    for (const isDark of [true, false]) {
      for (const size of [200, 1000]) {
        const svg = await summaryCard({ user: data, size, isDark })
        assert.match(svg, /^<svg\b/)
        assert.ok(!/NaN|Infinity/.test(svg))
      }
    }
  }
})

test('summary card shows the next tier gap, breakdown and earning points', async (t) => {
  const renderer = require('../src/cards')
  t.mock.method(renderer, 'generate', async (el) => JSON.stringify(el))
  const tree = await summaryCard({ user, size: 200, isDark: true })
  for (const s of [
    '+89',
    'Platinum V까지',
    '+1,239',
    '+150',
    '+122',
    'Gold I',
    '+10',
  ])
    assert.ok(tree.includes(`"${s}"`), s)
  assert.ok(
    !tree.includes('다음 점수까지'),
    'hidden while the formula disagrees',
  )
})
