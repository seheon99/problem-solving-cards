/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- CommonJS test runner loads TypeScript through ts-node. */
const assert = require('node:assert/strict')
const { test } = require('node:test')

process.env.SOLVEDAC_CLIENT_ID ??= 'test'
process.env.SOLVEDAC_CLIENT_SECRET ??= 'test'
const RequestManager = require('../src/structures/Request').default

const logger = { child: () => logger, info() {}, warn() {}, error() {} }
const v4User = {
  handle: 'seheon99',
  tier: 15,
  classPlus: false,
  profileImageUrl: null,
}

function manager(search) {
  const m = new RequestManager(logger)
  m.rest = {
    get: async (path) => {
      if (path === '/rankings/users/search') return search()
      return { data: v4User }
    },
  }
  return m
}

test('rank comes from the rankings search exact match', async () => {
  const m = manager(async () => ({
    data: { exact: { handle: 'seheon99', rank: 16121 } },
  }))
  assert.equal((await m.getUser('SEHEON99')).rank, 16121)
})

test('a different exact handle or a failed search leaves rank unset', async () => {
  const other = manager(async () => ({
    data: { exact: { handle: 'someone', rank: 1 } },
  }))
  assert.equal((await other.getUser('seheon99')).rank, undefined)
  const failing = manager(async () => {
    throw new Error('rate limited')
  })
  const user = await failing.getUser('seheon99')
  assert.equal(user.handle, 'seheon99')
  assert.equal(user.rank, undefined)
})
