/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- CommonJS test runner loads TypeScript through ts-node. */
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const satori = require('satori').default
const renderer = require('../src/cards')
const { problemCard } = require('../src/cards/problems')

const stat = (level, solved) => ({
  level,
  solved,
  total: solved,
  tried: 0,
  partial: 0,
})
const stats = [
  stat(1, 40),
  stat(5, 34),
  stat(6, 50),
  stat(10, 67),
  stat(11, 63),
  stat(16, 11),
]
const params = {
  user: {
    handle: 'seheon99',
    tier: 16,
    solvedCount: 999,
    profileImageUrl: null,
  },
  stats,
  size: 200,
  isDark: true,
}

function nodes(element) {
  if (element == null || typeof element === 'boolean') return []
  if (Array.isArray(element)) return element.flatMap(nodes)
  if (typeof element !== 'object') return [element]
  return [element, ...nodes(element.props.children)]
}

async function content(t, overrides = {}) {
  const generate = t.mock.method(
    renderer,
    'generate',
    async (element) => element,
  )
  try {
    return nodes(await problemCard({ ...params, ...overrides }))
  } finally {
    generate.mock.restore()
  }
}

test('groups solved levels into tier counts and percentages of the rated total', async (t) => {
  const values = await content(t, {
    stats: [...stats, stat(0, 100), stat(31, 400)],
  })
  for (const value of [
    'Bronze',
    '74',
    '27.9%',
    'Silver',
    '117',
    '44.2%',
    'Gold',
    '63',
    '23.8%',
    'Platinum',
    '11',
    '4.2%',
    '265',
  ]) {
    assert.ok(values.includes(value), value)
  }
  assert.ok(!values.includes('Diamond'))
  assert.ok(!values.includes('Ruby'))
  assert.ok(!values.includes('999'))
})

test('includes Diamond and Ruby when solved and leaves input unchanged', async (t) => {
  const input = [stat(30, 2), stat(21, 3), stat(1, 5)]
  const before = structuredClone(input)
  const values = await content(t, { stats: input })
  for (const value of [
    'Bronze',
    'Diamond',
    'Ruby',
    '50.0%',
    '30.0%',
    '20.0%',
  ]) {
    assert.ok(values.includes(value), value)
  }
  assert.deepEqual(input, before)
  assert.ok(values.indexOf('Bronze') < values.indexOf('Diamond'))
  assert.ok(values.indexOf('Diamond') < values.indexOf('Ruby'))
})

test('empty and unrated-only profiles show zero without misleading percentages', async (t) => {
  for (const sample of [[], [stat(0, 100)], [stat(5, 0)]]) {
    const values = await content(t, { stats: sample })
    assert.ok(values.includes('0'))
    assert.ok(values.includes('아직 해결한 난이도별 문제가 없어요'))
    assert.ok(
      !values.some((value) => typeof value === 'string' && value.endsWith('%')),
    )
  }
})

test('chart slices start with the hardest solved level, independent of input order', async (t) => {
  const values = await content(t, {
    stats: [stat(1, 3), stat(30, 2), stat(15, 1)],
  })
  const slices = values.filter(
    (value) => value?.type === 'path' && value.props['aria-label'],
  )
  assert.deepEqual(
    slices.map((slice) => slice.props['aria-label']),
    ['Ruby I: 2', 'Gold I: 1', 'Bronze V: 3'],
  )
})

test('tier names and percentages remain readable in actual rendered SVG', async (t) => {
  t.mock.method(renderer, 'generate', (element, size) =>
    satori(element, {
      height: size,
      embedFont: false,
      fonts: [
        {
          name: 'Pretendard-SemiBold',
          data: readFileSync(
            join(__dirname, '../fonts/Pretendard-SemiBold.otf'),
          ),
        },
      ],
    }),
  )
  const svg = await problemCard(params)
  const renderedText = [...svg.matchAll(/<text\b[^>]*>(.*?)<\/text>/g)]
    .map((match) => match[1])
    .join('')
  assert.equal(renderedText.split('난이도 분포').length - 1, 1)
  for (const text of [
    'Bronze',
    'Silver',
    'Gold',
    'Platinum',
    '27.9%',
    '44.2%',
    '23.8%',
    '4.2%',
    '265',
  ]) {
    assert.ok(renderedText.includes(text), text)
  }
})

test('renders empty, single-level and six-tier profiles offline in both themes and size limits', async (t) => {
  let downloads = 0
  t.mock.method(globalThis, 'fetch', async () => {
    downloads++
    throw new Error('Cards must render offline')
  })
  const samples = [
    [],
    [stat(0, 100)],
    [stat(15, 100000)],
    [1, 6, 11, 16, 21, 26].map((level) => stat(level, 1)),
  ]
  for (const isDark of [true, false]) {
    for (const size of [200, 1000]) {
      for (const sample of samples) {
        const svg = await problemCard({
          ...params,
          stats: sample,
          isDark,
          size,
          user: { ...params.user, handle: 'W'.repeat(64) },
        })
        assert.match(svg, /^<svg\b/)
        assert.match(svg, new RegExp(`height="${size}"`))
        assert.doesNotMatch(svg, /NaN|Infinity/)
      }
    }
  }
  assert.equal(downloads, 0)
})
