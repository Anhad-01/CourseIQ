const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'courseiq.accessToken'

export const DEFAULT_PREFERENCES = {
  preferred_platforms: ['Coursera', 'Udemy', 'NPTEL', 'edX'],
  skill_level: 'Intermediate',
  budget: 'under_50',
  interests: ['machine learning', 'frontend', 'python'],
  learning_goal:
    'Build production-ready AI products and improve software engineering fundamentals.',
}

function getToken() {
  return window.localStorage.getItem(TOKEN_KEY)
}

function setToken(token) {
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token)
  }
}

async function request(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const payload = await response.json()
      message = payload.detail || message
    } catch {
      message = response.statusText || message
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

function authPayload(credentials) {
  return {
    full_name: credentials.full_name,
    email: credentials.email,
    password: credentials.password,
  }
}

export const auth = {
  async me() {
    return request('/auth/me')
  },

  async register(credentials) {
    const result = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(authPayload(credentials)),
    })
    setToken(result.access_token)
    return result.user
  },

  async login(credentials) {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(authPayload(credentials)),
    })
    setToken(result.access_token)
    return result.user
  },

  async logout() {
    window.localStorage.removeItem(TOKEN_KEY)
    return true
  },
}

const SearchHistory = {
  list({ limit = 20 } = {}) {
    return request(`/search-history?limit=${limit}`)
  },
}

const Course = {
  list({ limit = 6 } = {}) {
    return request(`/courses/recent?limit=${limit}`)
  },
}

const SavedCourse = {
  list() {
    return request('/saved-courses')
  },

  createFromCourse(course) {
    return request('/saved-courses', {
      method: 'POST',
      body: JSON.stringify({ course_id: course.id, course }),
    })
  },

  update(id, patch) {
    return request(`/saved-courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  },

  delete(id) {
    return request(`/saved-courses/${id}`, {
      method: 'DELETE',
    })
  },
}

const UserPreference = {
  async get() {
    try {
      return await request('/preferences')
    } catch (error) {
      if (error.message === 'auth_required') {
        throw error
      }
      return DEFAULT_PREFERENCES
    }
  },

  upsert(values) {
    return request('/preferences', {
      method: 'PUT',
      body: JSON.stringify(values),
    })
  },

  async isSetupComplete() {
    const result = await request('/preferences/setup-complete')
    return result.setup_complete
  },
}

export async function searchCourses(query) {
  return request('/courses/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

export async function generateRecommendations() {
  return request('/recommendations', {
    method: 'POST',
    body: JSON.stringify({}),
  })
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
