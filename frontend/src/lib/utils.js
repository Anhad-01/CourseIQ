import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const PLATFORM_OPTIONS = [
  'Coursera',
  'Udemy',
  'NPTEL',
  'edX',
  'Khan Academy',
  'LinkedIn Learning',
  'FutureSkills Prime',
]

export const PLATFORM_STYLES = {
  Coursera: 'border-blue-200 bg-blue-100 text-blue-700',
  Udemy: 'border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700',
  NPTEL: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  edX: 'border-slate-200 bg-slate-100 text-slate-700',
  'Khan Academy': 'border-green-200 bg-green-100 text-green-700',
  'LinkedIn Learning': 'border-sky-200 bg-sky-100 text-sky-700',
  'FutureSkills Prime': 'border-orange-200 bg-orange-100 text-orange-700',
}

export const STATUS_OPTIONS = [
  { label: 'Bookmarked', value: 'bookmarked' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
]

export const SKILL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced']

export const BUDGET_OPTIONS = [
  { label: 'Free', value: 'free' },
  { label: 'Under $50', value: 'under_50' },
  { label: 'Under $100', value: 'under_100' },
  { label: 'Any', value: 'any' },
]

export const TRENDING_TOPICS = [
  'Generative AI for Developers',
  'React Frontend Systems',
  'Machine Learning Foundations',
  'Data Structures in Python',
  'Cloud DevOps Basics',
]

export const RECOMMENDATION_META = {
  'content-based': {
    label: 'Content Based',
    accent: 'border-primary/20 bg-primary/10 text-primary',
  },
  collaborative: {
    label: 'Collaborative',
    accent: 'border-chart-4/20 bg-chart4/10 text-chart4',
  },
  discovery: {
    label: 'Discovery',
    accent: 'border-chart-3/20 bg-chart3/10 text-amber-700',
  },
}

export function formatPrice(price) {
  if (price === 0 || price === 'Free') {
    return 'Free'
  }

  const value = Number(price)
  if (Number.isNaN(value)) {
    return String(price)
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(dateLike) {
  if (!dateLike) {
    return 'Recently'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateLike))
}

export function budgetLabel(value) {
  return BUDGET_OPTIONS.find((option) => option.value === value)?.label ?? 'Any'
}

export function normalizeText(value = '') {
  return value.toLowerCase().trim()
}

export function titleCase(value = '') {
  return value
    .replace(/[_-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function slugify(value = '') {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function uniqueBy(items, getKey) {
  const seen = new Set()
  return items.filter((item) => {
    const key = getKey(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

export function groupBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(item)
    return acc
  }, {})
}
