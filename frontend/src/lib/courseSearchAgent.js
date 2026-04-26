import { getCourseCatalog } from './mockBase44'
import { normalizeText } from './utils'

const QUERY_LEVEL_MAP = {
  beginner: 'Beginner',
  basic: 'Beginner',
  introductory: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Advanced',
}

const ADJACENT_CATEGORIES = {
  'Machine Learning': ['Artificial Intelligence', 'Data Science', 'Deep Learning'],
  'Artificial Intelligence': ['Machine Learning', 'Deep Learning', 'AI Product Management'],
  'Data Science': ['Machine Learning', 'Programming Fundamentals', 'Deep Learning'],
  'Frontend Development': ['Design', 'Programming Fundamentals'],
  DevOps: ['Programming Fundamentals', 'Artificial Intelligence'],
  Design: ['Frontend Development', 'AI Product Management'],
  'Programming Fundamentals': ['Frontend Development', 'Data Science'],
}

function parseIntent(query = '') {
  const normalized = normalizeText(query)
  const tokens = normalized.split(/[^a-z0-9+#]+/).filter(Boolean)
  const inferredSkillToken = tokens.find((token) => QUERY_LEVEL_MAP[token])

  return {
    raw: query,
    normalized,
    tokens,
    inferredSkill: inferredSkillToken ? QUERY_LEVEL_MAP[inferredSkillToken] : null,
  }
}

function budgetToLimit(budget) {
  switch (budget) {
    case 'free':
      return 0
    case 'under_50':
      return 50
    case 'under_100':
      return 100
    default:
      return Number.POSITIVE_INFINITY
  }
}

function semanticSimilarity(course, intent) {
  if (!intent.tokens.length) {
    return 0.4
  }

  const haystack = normalizeText(
    [
      course.course_title,
      course.description,
      course.category,
      course.instructor,
      course.skill_level,
      course.platform,
    ].join(' '),
  )

  const matches = intent.tokens.filter((token) => haystack.includes(token)).length
  const phraseBonus = intent.normalized && haystack.includes(intent.normalized) ? 0.28 : 0

  return Math.min(1, matches / intent.tokens.length + phraseBonus)
}

function skillMatch(course, preferences, intent) {
  const preferred = preferences?.skill_level || intent.inferredSkill
  if (!preferred) {
    return 1
  }

  return course.skill_level === preferred ? 1 : 0.5
}

function budgetPenalty(course, preferences) {
  const limit = budgetToLimit(preferences?.budget)

  if (!Number.isFinite(limit)) {
    return 0
  }

  const price = Number(course.price) || 0
  if (price <= limit) {
    return 0
  }

  return Math.min(1, (price - limit) / Math.max(limit || 25, 25))
}

function platformAllowed(course, preferences) {
  const allowed = preferences?.preferred_platforms || []
  if (!allowed.length) {
    return true
  }

  return allowed.includes(course.platform)
}

function enrichRanking(course, intent, preferences) {
  const similarity = semanticSimilarity(course, intent)
  const normalizedRating = Number(course.rating || 0) / 5
  const penalty = budgetPenalty(course, preferences)
  const levelMatch = skillMatch(course, preferences, intent)

  const total = 0.62 * similarity + 0.2 * normalizedRating - 0.12 * penalty + 0.06 * levelMatch

  return {
    ...course,
    similarity_score: Number(similarity.toFixed(3)),
    ranking_score: Number(total.toFixed(3)),
  }
}

export async function searchCoursesWithAI(query, preferences = {}) {
  const intent = parseIntent(query)
  const catalog = getCourseCatalog()

  const results = catalog
    .filter((course) => platformAllowed(course, preferences))
    .map((course) => enrichRanking(course, intent, preferences))
    .filter((course) => course.similarity_score >= 0.18 || course.ranking_score >= 0.36)
    .sort((a, b) => {
      if (b.ranking_score !== a.ranking_score) {
        return b.ranking_score - a.ranking_score
      }
      return (b.rating || 0) - (a.rating || 0)
    })
    .slice(0, 9)

  return results
}

function deriveInterestSignals(searchHistory = [], savedCourses = [], preferences = {}) {
  const signals = []

  searchHistory.forEach((entry) => {
    signals.push(...parseIntent(entry.query).tokens)
  })

  savedCourses.forEach((course) => {
    signals.push(...parseIntent(course.course_title).tokens)
    signals.push(...parseIntent(course.category).tokens)
    signals.push(...parseIntent(course.description || '').tokens)
  })

  ;(preferences.interests || []).forEach((interest) => {
    signals.push(...parseIntent(interest).tokens)
  })

  return signals
}

function contentBasedScore(course, signals, savedCourses, preferences) {
  const signalSet = new Set(signals)
  const categoryMatch = savedCourses.some((item) => item.category === course.category) ? 0.35 : 0
  const text = normalizeText(`${course.course_title} ${course.description} ${course.category}`)
  const keywordMatches = Array.from(signalSet).filter((token) => text.includes(token)).length
  const platformBoost = preferences?.preferred_platforms?.includes(course.platform) ? 0.1 : 0
  const ratingBoost = Number(course.rating || 0) / 10

  return categoryMatch + Math.min(0.55, keywordMatches * 0.08) + platformBoost + ratingBoost
}

function collaborativeScore(course, savedCourses, preferences) {
  const statusWeight = savedCourses.reduce((accumulator, item) => {
    if (item.platform !== course.platform) {
      return accumulator
    }

    if (item.status === 'completed') {
      return accumulator + 0.3
    }

    if (item.status === 'in_progress') {
      return accumulator + 0.2
    }

    return accumulator + 0.1
  }, 0)

  const platformBoost = preferences?.preferred_platforms?.includes(course.platform) ? 0.2 : 0
  const ratingBoost = Number(course.rating || 0) / 5

  return ratingBoost + statusWeight + platformBoost
}

function discoveryScore(course, savedCourses, preferences) {
  const seenCategories = [...new Set(savedCourses.map((item) => item.category))]
  const adjacentHit = seenCategories.some((category) =>
    (ADJACENT_CATEGORIES[category] || []).includes(course.category),
  )
  const noveltyBoost = seenCategories.includes(course.category) ? 0.05 : 0.22
  const budgetBoost = budgetPenalty(course, preferences) === 0 ? 0.15 : 0
  const ratingBoost = Number(course.rating || 0) / 10

  return (adjacentHit ? 0.45 : 0.18) + noveltyBoost + budgetBoost + ratingBoost
}

function reasonFor(course, type) {
  if (type === 'content-based') {
    return `Matches your recent interest in ${course.category} and aligns with topics from your saved courses.`
  }

  if (type === 'collaborative') {
    return `Popular among learners with similar platform and progress patterns, with a rating of ${course.rating}.`
  }

  return `Introduces a nearby topic in ${course.category} to broaden your learning path without drifting too far from your goals.`
}

export async function getRecommendations(searchHistory = [], savedCourses = [], preferences = {}) {
  const catalog = getCourseCatalog()
  const savedIds = new Set(savedCourses.map((course) => course.source_course_id || course.id))
  const signals = deriveInterestSignals(searchHistory, savedCourses, preferences)

  const candidates = catalog
    .filter((course) => !savedIds.has(course.id))
    .filter(
      (course) =>
        !preferences?.preferred_platforms?.length ||
        preferences.preferred_platforms.includes(course.platform),
    )
    .map((course) => {
      const content = contentBasedScore(course, signals, savedCourses, preferences)
      const collaborative = collaborativeScore(course, savedCourses, preferences)
      const discovery = discoveryScore(course, savedCourses, preferences)

      const rankedTypes = [
        ['content-based', content],
        ['collaborative', collaborative],
        ['discovery', discovery],
      ].sort((a, b) => b[1] - a[1])

      const [recommendationType, bestScore] = rankedTypes[0]

      return {
        ...course,
        recommendation_type: recommendationType,
        recommendation_reason: reasonFor(course, recommendationType),
        recommendation_score: Number(bestScore.toFixed(3)),
      }
    })
    .sort((a, b) => {
      if (b.recommendation_score !== a.recommendation_score) {
        return b.recommendation_score - a.recommendation_score
      }
      return (b.rating || 0) - (a.rating || 0)
    })

  const grouped = {
    'content-based': candidates.filter((item) => item.recommendation_type === 'content-based').slice(0, 3),
    collaborative: candidates.filter((item) => item.recommendation_type === 'collaborative').slice(0, 2),
    discovery: candidates.filter((item) => item.recommendation_type === 'discovery').slice(0, 2),
  }

  return [...grouped['content-based'], ...grouped.collaborative, ...grouped.discovery]
    .filter(Boolean)
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, 7)
}
