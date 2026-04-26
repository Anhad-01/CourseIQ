const STORAGE_KEYS = {
  user: 'courseiq.user',
  searchHistory: 'courseiq.searchHistory',
  courses: 'courseiq.courses',
  savedCourses: 'courseiq.savedCourses',
  preferences: 'courseiq.preferences',
}

const DEFAULT_USER = {
  id: 'user-1',
  full_name: 'Anhad Student',
  email: 'anhad@example.com',
}

const DEFAULT_PREFERENCES = {
  id: 'pref-1',
  preferred_platforms: ['Coursera', 'Udemy', 'NPTEL', 'edX'],
  skill_level: 'Intermediate',
  budget: 'under_50',
  interests: ['machine learning', 'frontend', 'python'],
  learning_goal:
    'Build production-ready AI products and improve software engineering fundamentals.',
}

const DEFAULT_CATALOG = [
  {
    id: 'course-1',
    platform: 'Coursera',
    course_title: 'Machine Learning Specialization',
    instructor: 'Andrew Ng',
    rating: 4.9,
    price: 49,
    duration: '3 months',
    url: 'https://www.coursera.org/specializations/machine-learning-introduction',
    description:
      'Build ML foundations with supervised learning, advanced algorithms, and practical recommender systems.',
    skill_level: 'Beginner',
    category: 'Machine Learning',
  },
  {
    id: 'course-2',
    platform: 'Udemy',
    course_title: 'React - The Complete Guide',
    instructor: 'Maximilian Schwarzmüller',
    rating: 4.7,
    price: 19,
    duration: '48 hours',
    url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
    description:
      'Master React 18, routing, state management, animations, and production deployment patterns.',
    skill_level: 'Intermediate',
    category: 'Frontend Development',
  },
  {
    id: 'course-3',
    platform: 'NPTEL',
    course_title: 'Data Structures and Algorithms using Python',
    instructor: 'Prof. Madhavan Mukund',
    rating: 4.6,
    price: 0,
    duration: '12 weeks',
    url: 'https://nptel.ac.in/',
    description:
      'Learn algorithms, complexity, recursion, trees, and graphs with Python-based implementations.',
    skill_level: 'Beginner',
    category: 'Programming Fundamentals',
  },
  {
    id: 'course-4',
    platform: 'edX',
    course_title: "CS50's Introduction to Artificial Intelligence with Python",
    instructor: 'David J. Malan',
    rating: 4.8,
    price: 0,
    duration: '7 weeks',
    url: 'https://www.edx.org/learn/artificial-intelligence/harvard-university-cs50-s-introduction-to-artificial-intelligence-with-python',
    description:
      'Explore search, optimization, machine learning, neural networks, and language models in Python.',
    skill_level: 'Intermediate',
    category: 'Artificial Intelligence',
  },
  {
    id: 'course-5',
    platform: 'LinkedIn Learning',
    course_title: 'Learning Docker',
    instructor: 'Ray Villalobos',
    rating: 4.5,
    price: 39,
    duration: '2 hours 10 minutes',
    url: 'https://www.linkedin.com/learning/',
    description:
      'Containerize applications, work with images, registries, volumes, and compose for developer workflows.',
    skill_level: 'Beginner',
    category: 'DevOps',
  },
  {
    id: 'course-6',
    platform: 'Khan Academy',
    course_title: 'Statistics and Probability',
    instructor: 'Khan Academy',
    rating: 4.8,
    price: 0,
    duration: 'Self paced',
    url: 'https://www.khanacademy.org/math/statistics-probability',
    description:
      'Sharpen your data intuition with probability distributions, sampling, inference, and significance.',
    skill_level: 'Beginner',
    category: 'Data Science',
  },
  {
    id: 'course-7',
    platform: 'FutureSkills Prime',
    course_title: 'AI for Product Managers',
    instructor: 'NASSCOM',
    rating: 4.4,
    price: 29,
    duration: '18 hours',
    url: 'https://futureskillsprime.in/',
    description:
      'Understand AI strategy, product framing, experimentation, and deployment trade-offs for business teams.',
    skill_level: 'Intermediate',
    category: 'AI Product Management',
  },
  {
    id: 'course-8',
    platform: 'Coursera',
    course_title: 'Google UX Design Certificate',
    instructor: 'Google Career Certificates',
    rating: 4.8,
    price: 39,
    duration: '6 months',
    url: 'https://www.coursera.org/professional-certificates/google-ux-design',
    description:
      'Research users, create wireframes, prototype interfaces, and run usability studies.',
    skill_level: 'Beginner',
    category: 'Design',
  },
  {
    id: 'course-9',
    platform: 'Udemy',
    course_title: 'Python for Data Science and Machine Learning Bootcamp',
    instructor: 'Jose Portilla',
    rating: 4.6,
    price: 24,
    duration: '25 hours',
    url: 'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/',
    description:
      'Use NumPy, pandas, seaborn, scikit-learn, and machine learning workflows on practical datasets.',
    skill_level: 'Intermediate',
    category: 'Data Science',
  },
  {
    id: 'course-10',
    platform: 'edX',
    course_title: 'DevOps for Developers',
    instructor: 'IBM',
    rating: 4.5,
    price: 79,
    duration: '8 weeks',
    url: 'https://www.edx.org/',
    description:
      'Learn CI/CD, cloud-native delivery, containers, observability, and deployment automation.',
    skill_level: 'Intermediate',
    category: 'DevOps',
  },
  {
    id: 'course-11',
    platform: 'NPTEL',
    course_title: 'Deep Learning',
    instructor: 'Prof. Balaraman Ravindran',
    rating: 4.7,
    price: 0,
    duration: '8 weeks',
    url: 'https://nptel.ac.in/',
    description:
      'Study neural networks, backpropagation, convolutional networks, sequence models, and practical training.',
    skill_level: 'Advanced',
    category: 'Deep Learning',
  },
  {
    id: 'course-12',
    platform: 'LinkedIn Learning',
    course_title: 'Become a Front-End Web Developer',
    instructor: 'LinkedIn Learning Paths',
    rating: 4.6,
    price: 29,
    duration: '23 hours',
    url: 'https://www.linkedin.com/learning/paths/become-a-front-end-web-developer',
    description:
      'Build a modern frontend foundation with HTML, CSS, JavaScript, React, accessibility, and responsive UI.',
    skill_level: 'Beginner',
    category: 'Frontend Development',
  },
]

function delay(ms = 160) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readStore(key, fallback) {
  if (!hasWindow()) {
    return clone(fallback)
  }

  const raw = window.localStorage.getItem(key)

  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(fallback))
    return clone(fallback)
  }

  try {
    return JSON.parse(raw)
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallback))
    return clone(fallback)
  }
}

function writeStore(key, value) {
  if (!hasWindow()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function createId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function sortByDateDesc(items, dateKey) {
  return [...items].sort(
    (a, b) => new Date(b[dateKey]).getTime() - new Date(a[dateKey]).getTime(),
  )
}

function seedCoursesIfNeeded() {
  const existing = readStore(STORAGE_KEYS.courses, [])

  if (existing.length) {
    return
  }

  const seeded = DEFAULT_CATALOG.map((course, index) => ({
    ...course,
    discovered_at: new Date(Date.now() - index * 1000 * 60 * 60 * 12).toISOString(),
  }))

  writeStore(STORAGE_KEYS.courses, seeded)
}

function ensureSeeded() {
  readStore(STORAGE_KEYS.user, DEFAULT_USER)
  readStore(STORAGE_KEYS.searchHistory, [])
  readStore(STORAGE_KEYS.savedCourses, [])
  readStore(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES)
  seedCoursesIfNeeded()
}

export function getCourseCatalog() {
  ensureSeeded()
  return readStore(STORAGE_KEYS.courses, DEFAULT_CATALOG)
}

export const auth = {
  async me() {
    ensureSeeded()
    await delay()
    return readStore(STORAGE_KEYS.user, DEFAULT_USER)
  },

  async logout() {
    await delay(100)
    return true
  },
}

const SearchHistory = {
  async list({ limit = 20 } = {}) {
    ensureSeeded()
    await delay(100)

    const items = readStore(STORAGE_KEYS.searchHistory, [])
    return sortByDateDesc(items, 'created_at').slice(0, limit)
  },

  async create({ query }) {
    ensureSeeded()
    await delay(90)

    const entry = {
      id: createId('search'),
      query,
      created_at: new Date().toISOString(),
    }

    const current = readStore(STORAGE_KEYS.searchHistory, [])
    const next = [entry, ...current].slice(0, 50)
    writeStore(STORAGE_KEYS.searchHistory, next)

    return entry
  },
}

const Course = {
  async list({ limit } = {}) {
    ensureSeeded()
    await delay(120)

    const items = sortByDateDesc(readStore(STORAGE_KEYS.courses, []), 'discovered_at')
    return typeof limit === 'number' ? items.slice(0, limit) : items
  },

  async bulkUpsert(courses = []) {
    ensureSeeded()
    await delay(120)

    const existing = readStore(STORAGE_KEYS.courses, [])
    const byKey = new Map(
      existing.map((course) => [`${course.platform}-${course.course_title}`, course]),
    )

    courses.forEach((course) => {
      const key = `${course.platform}-${course.course_title}`
      const current = byKey.get(key)

      byKey.set(key, {
        ...current,
        ...course,
        id: current?.id ?? course.id ?? createId('course'),
        discovered_at: new Date().toISOString(),
      })
    })

    const merged = Array.from(byKey.values())
    writeStore(STORAGE_KEYS.courses, merged)

    return merged
  },
}

const SavedCourse = {
  async list() {
    ensureSeeded()
    await delay(100)

    return sortByDateDesc(readStore(STORAGE_KEYS.savedCourses, []), 'updated_at')
  },

  async createFromCourse(course, status = 'bookmarked') {
    ensureSeeded()
    await delay(90)

    const current = readStore(STORAGE_KEYS.savedCourses, [])
    const existing = current.find(
      (item) =>
        item.source_course_id === course.id ||
        (item.course_title === course.course_title && item.platform === course.platform),
    )

    if (existing) {
      return existing
    }

    const savedCourse = {
      ...course,
      id: createId('saved'),
      source_course_id: course.id,
      status,
      saved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    writeStore(STORAGE_KEYS.savedCourses, [savedCourse, ...current])
    return savedCourse
  },

  async update(id, patch) {
    ensureSeeded()
    await delay(90)

    const current = readStore(STORAGE_KEYS.savedCourses, [])
    const next = current.map((item) =>
      item.id === id
        ? {
            ...item,
            ...patch,
            updated_at: new Date().toISOString(),
          }
        : item,
    )

    writeStore(STORAGE_KEYS.savedCourses, next)
    return next.find((item) => item.id === id) ?? null
  },

  async delete(id) {
    ensureSeeded()
    await delay(90)

    const current = readStore(STORAGE_KEYS.savedCourses, [])
    const next = current.filter((item) => item.id !== id)
    writeStore(STORAGE_KEYS.savedCourses, next)

    return true
  },
}

const UserPreference = {
  async get() {
    ensureSeeded()
    await delay(90)
    return readStore(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES)
  },

  async upsert(values) {
    ensureSeeded()
    await delay(110)

    const current = readStore(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES)
    const next = {
      ...current,
      ...values,
      id: current.id ?? createId('pref'),
    }

    writeStore(STORAGE_KEYS.preferences, next)
    return next
  },
}

export const base44 = {
  auth,
  entities: {
    SearchHistory,
    Course,
    SavedCourse,
    UserPreference,
  },
}

export { SearchHistory, Course, SavedCourse, UserPreference }
