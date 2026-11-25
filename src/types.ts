export type User = {
  handle: string
  bio: string
  badgeId: string | null
  backgroundId: string
  profileImageUrl: string | null
  solvedCount: number
  voteCount: number
  tier: number
  rating: number
  ratingByProblemsSum: number
  ratingProblemsCutoff?: number
  ratingByClass: number
  ratingBySolvedCount: number
  ratingByVoteCount: number
  class: number
  classDecoration: 'none' | 'silver' | 'gold'
  rivalCount: number
  reverseRivalCount: number
  maxStreak?: number
  coins: number
  stardusts: number
  joinedAt: string
  bannedUntil: string
  proUntil: string
  rank?: number
}

export type HexColorString = `#${string}`

export type Tier = {
  color: HexColorString
  detailedColor: HexColorString
  name: string
  rating: number
  gradient: string
}

export type ProblemStat = {
  level: number
  solved: number
  tried: number
  partial: number
  total: number
}

type Tag = {
  key: string
  isMeta: boolean
  bojTagId: number
  problemCount: number
  displayNames: {
    language: Language
    name: string
    short: string
  }[]
  aliases: Alias[]
}

type Language = 'ko' | 'en' | 'ja'

type Alias = {
  alias: string
}

export type TagRatingStat = {
  tag: Pick<Tag, 'key'>
  solvedCount: number
  rating: number
  ratingByProblemsSum: number
  ratingByClass: number
  ratingBySolvedCount: number
  ratingProblemsCutoff: number
}

export type Theme = {
  base: HexColorString
  crust: HexColorString
  mantle: HexColorString
  text: HexColorString
  sub: HexColorString
}

export type ActivityDay = {
  day: string // YYYY-MM-DD
  solvedCount: number
  maxSolvedLevel: number
  freezeUsed: boolean
}

export type Activity = {
  from: string
  to: string
  days: ActivityDay[]
  currentStreak: number
  maxStreak: number
}

export type RatingPoint = { day: string; value: number }
