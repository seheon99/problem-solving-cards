import type {
  Activity,
  ProblemStat,
  RatingPoint,
  TagRatingStat,
  User,
} from '../types'
import axios from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'
import type { FastifyBaseLogger } from 'fastify'

const { SOLVEDAC_CLIENT_ID, SOLVEDAC_CLIENT_SECRET } = process.env
if (!SOLVEDAC_CLIENT_ID || !SOLVEDAC_CLIENT_SECRET)
  throw new Error('SOLVEDAC_CLIENT_ID and SOLVEDAC_CLIENT_SECRET must be set')

// solved.ac handles are alphanumerics and underscores; anything else never reaches the API
export const isValidHandle = (handle: string) =>
  /^[A-Za-z0-9_]{1,64}$/.test(handle)

type V4User = Omit<User, 'classDecoration'> & {
  classPlus: boolean
  tagRatings: (Omit<TagRatingStat, 'tag'> & { key: string })[]
}

type V4ProblemPage = {
  total: number
  pageSize: number
  problems: { level: number }[]
}

export default class RequestManager {
  private rest: AxiosInstance

  private logger: FastifyBaseLogger

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger.child({ name: 'Request' })

    this.rest = axios.create({
      baseURL: 'https://solved.ac/api/v4',
      headers: {
        Accept: 'application/json',
        'x-client-id': SOLVEDAC_CLIENT_ID,
        'x-client-secret': SOLVEDAC_CLIENT_SECRET,
      },
    })
  }

  // ponytail: in-process 10-minute cache, unbounded keys; swap for an LRU if handle count grows
  private cache = new Map<string, { at: number; data: unknown }>()

  private async get<T>(path: string, params?: Record<string, string | number>) {
    const key = `${path}?${new URLSearchParams(
      params as Record<string, string>,
    )}`
    const hit = this.cache.get(key)
    if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.data as T | null

    this.logger.info(`GET ${key}`)

    const { data } = await this.rest
      .get<T>(path, { params })
      .catch((err: AxiosError | Error) => {
        if (axios.isAxiosError(err) && err.response?.status === 404)
          return { data: null }

        throw err
      })

    this.cache.set(key, { at: Date.now(), data })
    return data
  }

  private getV4User(handle: string) {
    return this.get<V4User>(`/users/${encodeURIComponent(handle)}`)
  }

  async getUser(handle: string): Promise<User | null> {
    const user = await this.getV4User(handle)
    if (!user) return null

    // ponytail: v4 only says whether class has a plus, so "+" maps to silver
    return {
      ...user,
      classDecoration: user.classPlus ? 'silver' : 'none',
      profileImageUrl: await this.fetchImage(user.profileImageUrl),
    }
  }

  // satori can't size an image it can't download, so inline it, or return null to draw a placeholder
  private async fetchImage(url: string | null) {
    if (!url) return null

    try {
      const res = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        timeout: 5000,
      })
      const type = res.headers['content-type']
      if (!String(type).startsWith('image/')) return null

      return `data:${type};base64,${Buffer.from(res.data).toString('base64')}`
    } catch {
      return null
    }
  }

  // v4 has no per-level stats endpoint: page through the user's solved problems and count levels.
  // ponytail: one request per 50 solved problems; cache per handle if rate limits bite
  // Callers check the user exists first. One search per level, reading only `total`,
  // so the cost is 31 requests however many problems the user has solved.
  async getProblemStats(handle: string): Promise<ProblemStat[] | null> {
    const totals = await Promise.all(
      Array.from({ length: 31 }, (_, level) =>
        this.get<V4ProblemPage>('/problems', {
          q: `s@${handle} *${level}`,
          page: 1,
        }),
      ),
    )
    if (totals.some((t) => !t)) return null

    const solved = totals.map((t) => t!.total)

    // tried/partial aren't available in v4; the card only draws solved counts
    return solved.map((count, level) => ({
      level,
      solved: count,
      tried: 0,
      partial: 0,
      total: count,
    }))
  }

  async getTagRatingStats(handle: string): Promise<TagRatingStat[] | null> {
    const user = await this.getV4User(handle)
    if (!user) return null

    return user.tagRatings.map(({ key, ...rest }) => ({
      ...rest,
      tag: { key },
    }))
  }

  async getActivity(handle: string, from: string, to: string) {
    return this.get<Activity>(
      `/users/${encodeURIComponent(handle)}/activity/days`,
      { from, to },
    )
  }

  async getRatingHistory(handle: string): Promise<RatingPoint[] | null> {
    const res = await this.get<{ history: RatingPoint[] }>(
      `/users/${encodeURIComponent(handle)}/rating/history`,
      { range: '1y' },
    )
    return res?.history ?? null
  }
}
