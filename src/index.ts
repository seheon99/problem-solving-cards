import { problemCard } from './cards/problems'
import { profileCard } from './cards/profile'
import { ratingCard } from './cards/rating'
import { kstToday, streakCard, streakRange } from './cards/streak'
import { tagCard } from './cards/tags'
import CacheManager from './structures/Cache'
import RequestManager, { isValidHandle } from './structures/Request'
import fastify from 'fastify'
import { readFile } from 'fs/promises'
import { join } from 'path'

const app = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss.l mm/dd/yyyy (Z)',
        ignore: 'pid,hostname',
      },
    },
  },
})

export const logger = app.log

const cacheManager = new CacheManager(logger)
const requestManager = new RequestManager(logger)

app.get('/', async (_, reply) => {
  reply.redirect('https://github.com/seheon99/solvedac-cards')
})

app.get('/favicon.ico', async (_, reply) => {
  reply
    .code(200)
    .type('image/x-icon')
    .send(await readFile(join(__dirname, '../assets/favicon.ico')))
})

app.get('/profile/:handle', async (request, reply) => {
  const { handle } = request.params as { handle?: string }
  const { size, color } = request.query as {
    size?: string
    color?: string
  }

  if (!handle || !isValidHandle(handle))
    return reply.code(400).send('Invalid User ID')

  if (color && color !== 'dark' && color !== 'light')
    return reply.code(400).send('Invalid Color, Must be dark or light')
  const isDark = color === 'light' ? false : true

  const _size = parseInt(size ?? '100')
  if (_size < 100 || _size > 500)
    return reply.code(400).send('Invalid Size, Must be between 100 and 500')

  const data = await requestManager.getUser(handle)

  if (!data) return reply.code(404).send('User Not Found')

  reply
    .code(200)
    .type('image/svg+xml')
    .header('Cache-Control', 'public, max-age=0, must-revalidate')
    .send(
      await cacheManager.generateCachedCard(
        {
          data,
          size: _size,
          isDark,
        },
        profileCard,
      ),
    )
})

app.get('/problems/:handle', async (request, reply) => {
  const { handle } = request.params as { handle?: string }
  const { size, color } = request.query as {
    size?: string
    color?: string
  }

  if (!handle || !isValidHandle(handle))
    return reply.code(400).send('Invalid User ID')

  if (color && color !== 'dark' && color !== 'light')
    return reply.code(400).send('Invalid Color, Must be dark or light')
  const isDark = color === 'light' ? false : true

  const _size = parseInt(size ?? '200')
  if (_size < 200 || _size > 1000)
    return reply.code(400).send('Invalid Size, Must be between 200 and 1000')

  const user = await requestManager.getUser(handle)
  const stats = await requestManager.getProblemStats(handle)

  if (!user || !stats) return reply.code(404).send('User Not Found')

  reply
    .code(200)
    .type('image/svg+xml')
    .header('Cache-Control', 'public, max-age=0, must-revalidate')
    .send(
      await cacheManager.generateCachedCard(
        {
          user,
          stats,
          size: _size,
          isDark,
        },
        problemCard,
      ),
    )
})

app.get('/tags/:handle', async (request, reply) => {
  const { handle } = request.params as { handle?: string }
  const { size, color, top, text } = request.query as {
    size?: string
    color?: string
    top?: boolean
    text?: boolean
  }

  if (!handle || !isValidHandle(handle))
    return reply.code(400).send('Invalid User ID')

  if (color && color !== 'dark' && color !== 'light')
    return reply.code(400).send('Invalid Color, Must be dark or light')
  const isDark = color === 'light' ? false : true

  const _size = parseInt(size ?? '200')
  if (_size < 200 || _size > 1000)
    return reply.code(400).send('Invalid Size, Must be between 200 and 1000')

  const user = await requestManager.getUser(handle)
  const stats = await requestManager.getTagRatingStats(handle)

  if (!user || !stats) return reply.code(404).send('User Not Found')

  reply
    .code(200)
    .type('image/svg+xml')
    .header('Cache-Control', 'public, max-age=0, must-revalidate')
    .send(
      await cacheManager.generateCachedCard(
        {
          user,
          stats,
          size: _size,
          isDark,
          top: !!top,
          text: !!text,
        },
        tagCard,
      ),
    )
})

const parseCommon = (
  query: { size?: string; color?: string },
  min: number,
  max: number,
  fallback: number,
) => {
  const { size, color } = query
  if (color && color !== 'dark' && color !== 'light')
    return 'Invalid Color, Must be dark or light'
  const _size = parseInt(size ?? String(fallback))
  if (!(_size >= min && _size <= max))
    return `Invalid Size, Must be between ${min} and ${max}`
  return { size: _size, isDark: color !== 'light' }
}

app.get('/streak/:handle', async (request, reply) => {
  const { handle } = request.params as { handle?: string }
  if (!handle || !isValidHandle(handle))
    return reply.code(400).send('Invalid User ID')
  const opts = parseCommon(request.query as object, 200, 1000, 200)
  if (typeof opts === 'string') return reply.code(400).send(opts)

  const today = kstToday()
  const { from, to } = streakRange(today)
  const [user, activity] = await Promise.all([
    requestManager.getUser(handle),
    requestManager.getActivity(handle, from, to),
  ])
  if (!user || !activity) return reply.code(404).send('User Not Found')

  reply
    .code(200)
    .type('image/svg+xml')
    .header('Cache-Control', 'public, max-age=0, must-revalidate')
    .send(
      await cacheManager.generateCachedCard(
        { user, activity, today, ...opts },
        streakCard,
      ),
    )
})

app.get('/rating/:handle', async (request, reply) => {
  const { handle } = request.params as { handle?: string }
  if (!handle || !isValidHandle(handle))
    return reply.code(400).send('Invalid User ID')
  const opts = parseCommon(request.query as object, 200, 1000, 200)
  if (typeof opts === 'string') return reply.code(400).send(opts)

  const [user, history] = await Promise.all([
    requestManager.getUser(handle),
    requestManager.getRatingHistory(handle),
  ])
  if (!user || !history) return reply.code(404).send('User Not Found')

  reply
    .code(200)
    .type('image/svg+xml')
    .header('Cache-Control', 'public, max-age=0, must-revalidate')
    .send(
      await cacheManager.generateCachedCard(
        { user, history, today: kstToday(), ...opts },
        ratingCard,
      ),
    )
})

app.listen({ port: 8000, host: '0.0.0.0' }, (err) => {
  if (err) throw err
})
