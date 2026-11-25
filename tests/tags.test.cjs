/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- CommonJS test runner loads TypeScript through ts-node. */
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const satori = require('satori').default
const { themeMapping } = require('../src/constants')
const renderer = require('../src/cards')
const { tagCard } = require('../src/cards/tags')

const stat = (key, rating) => ({
  tag: { key },
  rating,
  solvedCount: 0,
  ratingByProblemsSum: rating,
  ratingByClass: 0,
  ratingBySolvedCount: 0,
  ratingProblemsCutoff: 0,
})

const stats = [
  stat('math', 701),
  stat('impl', 762),
  stat('greedy', 128),
  stat('string', 364),
  stat('ds', 1035),
  stat('graph', 938),
  stat('dp', 887),
  stat('geom', 40),
  stat('brute', 467),
  stat('segtree', 460),
  stat('backtrack', 223),
  stat('sim', 104),
  stat('tree', 98),
  stat('number_theory', 94),
  stat('casework', 28),
]

const params = {
  user: { handle: 'seheon99', tier: 16, profileImageUrl: null },
  stats,
  size: 200,
  isDark: true,
  top: false,
  text: false,
}

function nodes(element) {
  if (element == null || typeof element === 'boolean') return []
  if (Array.isArray(element)) return element.flatMap(nodes)
  if (typeof element !== 'object') return [element]
  return [element, ...nodes(element.props.children)]
}

async function content(t, overrides = {}) {
  t.mock.method(renderer, 'generate', async (element) => element)
  return nodes(await tagCard({ ...params, ...overrides }))
}

test('shows named tags and live ratings even without the legacy text flag', async (t) => {
  const values = await content(t)
  assert.ok(values.includes('math'))
  assert.ok(values.includes('ds'))
  assert.ok(values.includes('1,035'))
  assert.ok(values.includes('number_theory'))
  assert.ok(values.includes('28'))
})

test('top selection sorts a copy and includes unfamiliar tag names', async (t) => {
  const input = [stat('math', 100), stat('new_tag', 3000), ...stats.slice(1)]
  const before = structuredClone(input)
  const values = await content(t, { stats: input, top: true })
  assert.ok(values.includes('new_tag'))
  assert.ok(values.indexOf('new_tag') < values.indexOf('ds'))
  assert.deepEqual(input, before)
})

test('missing default tags remain visible with zero ratings', async (t) => {
  const values = await content(t, { stats: [] })
  for (const key of [
    'math',
    'impl',
    'greedy',
    'string',
    'ds',
    'graph',
    'dp',
    'geom',
  ]) {
    assert.ok(values.includes(key), key)
  }
  assert.equal(values.filter((value) => value === '0').length, 8)
})

test('limits secondary tags while keeping the highest ratings', async (t) => {
  const values = await content(t, {
    stats: [...stats, stat('lowest_extra', 1), stat('highest_extra', 2000)],
  })
  assert.ok(values.includes('highest_extra'))
  assert.ok(!values.includes('lowest_extra'))
  assert.ok(!values.includes('casework'))
})

test('tier badges follow rating boundaries, including unrated and master', async (t) => {
  const values = await content(t, {
    stats: [
      stat('math', 0),
      stat('impl', 799),
      stat('greedy', 800),
      stat('string', 3000),
    ],
  })
  const labels = values
    .map((value) => value?.props?.['aria-label'])
    .filter(Boolean)
  assert.deepEqual(labels, [
    'Unrated',
    'Silver I',
    'Gold V',
    'Master',
    'Unrated',
    'Unrated',
    'Unrated',
    'Unrated',
  ])
})

test('keeps default tag names readable in the rendered card', async (t) => {
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
  const svg = await tagCard(params)
  for (const { tag } of stats) {
    assert.ok(
      svg.includes(`>${tag.key}</text>`),
      `${tag.key} must not be clipped`,
    )
  }
})

test('highlighted low-tier ratings retain readable theme text', async (t) => {
  const values = await content(t, { stats: [stat('math', 20)] })
  const rating = values.find(
    (value) => value?.type === 'span' && value.props.children === '20',
  )
  assert.equal(rating.props.style.color, themeMapping.get(true).text)
})

test('a long handle cannot wrap the tag heading', async (t) => {
  const headings = []
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
        if (node.type === 'span' && node.textContent === '태그')
          headings.push(node)
      },
    }),
  )
  await tagCard(params)
  await tagCard({ ...params, user: { ...params.user, handle: 'W'.repeat(64) } })
  assert.equal(headings.length, 2)
  assert.equal(headings[0].height, headings[1].height)
})

test('renders finite self-contained SVGs in both themes and at size limits', async (t) => {
  let downloads = 0
  t.mock.method(globalThis, 'fetch', async () => {
    downloads++
    throw new Error('Cards must render offline')
  })
  for (const isDark of [true, false]) {
    for (const size of [200, 1000]) {
      for (const sample of [
        stats,
        [],
        [stat('unfamiliar_long_tag_name', 3000)],
      ]) {
        const svg = await tagCard({ ...params, stats: sample, isDark, size })
        assert.match(svg, /^<svg\b/)
        assert.match(svg, new RegExp(`height="${size}"`))
        assert.doesNotMatch(
          svg,
          /NaN|Infinity|https:\/\/(?:cdn|static)\.solved\.ac/,
        )
      }
    }
  }
  assert.equal(downloads, 0)
})
