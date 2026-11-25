/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- CommonJS test runner loads TypeScript through ts-node. */
const assert = require('node:assert/strict')
const { test } = require('node:test')

process.env.SOLVEDAC_CLIENT_ID ??= 'test'
process.env.SOLVEDAC_CLIENT_SECRET ??= 'test'
const axios = require('axios')
const { leetcodeCard, ringArcs } = require('../src/cards/leetcode')
const RequestManager = require('../src/structures/Request').default
const { isValidLeetCodeHandle } = require('../src/structures/Request')

// From a live LeetCode response for seheon99
const stats = {
  username: 'seheon99',
  ranking: 2491578,
  solved: { All: 60, Easy: 29, Medium: 27, Hard: 4 },
  total: { All: 4124, Easy: 978, Medium: 2152, Hard: 994 },
  contest: null,
}

test('ring arcs split the circle by solved share, in order', () => {
  const arcs = ringArcs(stats.solved)
  assert.deepEqual(
    arcs.map((a) => a.d),
    ['Easy', 'Medium', 'Hard'],
  )
  assert.equal(arcs[0].start, 0)
  assert.ok(Math.abs(arcs[1].start - (29 / 60) * 100) < 1e-9)
  assert.ok(arcs.every((a) => a.len > 0))
  assert.deepEqual(ringArcs({ All: 0, Easy: 0, Medium: 0, Hard: 0 }), [])
  const single = ringArcs({ All: 3, Easy: 3, Medium: 0, Hard: 0 })
  assert.deepEqual(
    single,
    [{ d: 'Easy', start: 0, len: 100 }],
    'no gap for one arc',
  )
})

test('leetcode card renders and every animation hook lands', async () => {
  for (const s of [
    stats,
    {
      ...stats,
      ranking: null,
      solved: { All: 0, Easy: 0, Medium: 0, Hard: 0 },
    },
    {
      ...stats,
      contest: { rating: 2987.4, attended: 120, topPercentage: 0.2 },
    },
  ]) {
    for (const isDark of [true, false]) {
      for (const size of [200, 1000]) {
        const svg = await leetcodeCard({ stats: s, size, isDark })
        assert.match(svg, /^<svg\b/)
        assert.ok(!/NaN|Infinity/.test(svg))
        if (s.solved.All)
          for (const [, t] of svg.matchAll(/\[opacity="([^"]+)"\]/g))
            assert.ok(svg.includes(` opacity="${t}"`), t)
      }
    }
  }
})

test('leetcode card shows counts, ranking and missing contest as a dash', async (t) => {
  const renderer = require('../src/cards')
  t.mock.method(renderer, 'generate', async (el) => JSON.stringify(el))
  const tree = await leetcodeCard({ stats, size: 200, isDark: true })
  for (const s of ['60', '/ 4,124 해결', '29', '#2,491,578', '–', '1.5%'])
    assert.ok(tree.includes(`"${s}"`), s)
})

test('LeetCode handles allow hyphens', () => {
  assert.ok(isValidLeetCodeHandle('some-user_1'))
  assert.ok(!isValidLeetCodeHandle('bad user'))
})

test('getLeetCode maps the GraphQL response and returns null for unknown users', async (t) => {
  const logger = { child: () => logger, info() {} }
  const live = {
    data: {
      matchedUser: {
        username: 'seheon99',
        profile: { ranking: 2491578 },
        submitStatsGlobal: {
          acSubmissionNum: [
            { difficulty: 'All', count: 60 },
            { difficulty: 'Easy', count: 29 },
            { difficulty: 'Medium', count: 27 },
            { difficulty: 'Hard', count: 4 },
          ],
        },
      },
      userContestRanking: null,
      allQuestionsCount: [
        { difficulty: 'All', count: 4124 },
        { difficulty: 'Easy', count: 978 },
        { difficulty: 'Medium', count: 2152 },
        { difficulty: 'Hard', count: 994 },
      ],
    },
  }
  t.mock.method(axios, 'post', async () => ({ data: live }))
  assert.deepEqual(
    await new RequestManager(logger).getLeetCode('seheon99'),
    stats,
  )
  live.data.matchedUser = null
  assert.equal(await new RequestManager(logger).getLeetCode('nobody'), null)
})
