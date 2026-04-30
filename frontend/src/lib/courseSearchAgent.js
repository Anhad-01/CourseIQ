import { generateRecommendations, searchCourses } from './apiClient'

export async function searchCoursesWithAI(query, preferences = {}) {
  return searchCourses(query, preferences)
}

export async function getRecommendations(searchHistory = [], savedCourses = [], preferences = {}) {
  return generateRecommendations(searchHistory, savedCourses, preferences)
}
