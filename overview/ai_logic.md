# CourseIQ — AI Logic & Architecture

This document explains the complete AI pipeline powering CourseIQ: how courses are discovered, filtered, ranked, and recommended to users.

---

## 1. Course Discovery via AI Search

### How It Works

CourseIQ does **not** scrape websites directly. Instead, it leverages a Large Language Model (LLM) with **real-time internet access** to discover courses dynamically.

When a user submits a search query, the app calls:

```js
base44.integrations.Core.InvokeLLM({
  prompt: "...",
  add_context_from_internet: true,
  response_json_schema: { ... }
})
```

The `add_context_from_internet: true` flag instructs the underlying model to perform live web searches — similar to a Google search — before generating its response. This means:

- It browses platform pages (Udemy, Coursera, edX, NPTEL, etc.) at query time
- It retrieves real, currently-available courses with up-to-date metadata
- It is **not** working from a static offline index

### Platforms Searched

The following platforms are included in every search prompt:
- **Udemy** — paid and free courses
- **Coursera** — university-backed courses and specializations
- **NPTEL** — IIT/IISc courses (free, highly structured)
- **FutureSkills Prime** — India government-backed platform
- **edX** — university MOOCs
- **Khan Academy** — free beginner-level content
- **LinkedIn Learning** — professional development courses

### Structured Output

The LLM is instructed to return a **JSON-structured response** conforming to a defined schema. Each course includes:

| Field | Description |
|---|---|
| `platform` | Platform name |
| `course_title` | Exact course title |
| `instructor` | Instructor or organization |
| `rating` | Numerical rating out of 5 |
| `price` | Actual price or "Free" |
| `duration` | Duration estimate |
| `url` | Direct link to the course |
| `description` | 1–2 sentence summary |
| `skill_level` | beginner / intermediate / advanced / all_levels |
| `category` | Topic category |

The strict JSON schema eliminates hallucination risk on structure — the model fills in values, not fields.

---

## 2. Preference-Based Filtering (Pre-Search)

Before the LLM is called, user preferences stored in the `UserPreference` entity are injected directly into the prompt. This shapes the AI's output before any results are returned.

### Preference Injections

```
Platform preference  → "Focus especially on: Udemy, Coursera"
Budget preference    → "Budget: Free courses only" / "Under $50" / "Under $100" / "Any"
Skill level          → "Skill level: beginner"
```

This is a **prompt-level filter** — the AI understands natural language constraints and applies them when selecting which courses to return.

---

## 3. Post-Search Filtering (Client-Side)

After results are returned from the AI, users can apply a **platform filter** in the UI:

- Rendered as interactive badge buttons (All, Udemy, Coursera, etc.)
- Filters the in-memory `results` array client-side instantly
- No additional API call is made

This provides fast, zero-latency filtering on top of AI results.

---

## 4. Result Caching & Persistence

Once search results are returned:

1. **SearchHistory** entity records the query, result count, and platforms found.
2. **Course** entity bulk-creates all returned courses, tagged with the originating `search_query` and `created_by` (user email).

This serves two purposes:
- The **Dashboard** can display "Recently Discovered" courses per user
- The **Recommendations engine** uses this history to build a user profile

---

## 5. Hybrid Recommendation Engine

The `getRecommendations()` function in `courseSearchAgent.js` builds personalized course recommendations using a **three-signal hybrid approach**.

### Input Signals

| Signal | Source Entity |
|---|---|
| Recent search queries | `SearchHistory` (last 10) |
| Bookmarked/saved course titles | `SavedCourse` (last 10) |
| Stated preferences (interests, skill level, budget) | `UserPreference` |

### Three Recommendation Strategies

#### 1. Content-Based Filtering
Recommends courses **similar to what the user has already searched or saved**.
- Matches on topic, difficulty, and teaching style
- Example: If a user searched "React" and saved a React course, it recommends Vue.js or Next.js

#### 2. Collaborative Filtering
Recommends courses that **users with similar interest patterns typically enjoy**.
- The LLM uses its training knowledge of popular co-consumption patterns
- Example: Users who like "Machine Learning" also commonly take "Python for Data Science"

#### 3. Discovery (Serendipity)
Includes **1–2 adjacent-topic courses** the user hasn't explored yet.
- Expands the user's learning horizon
- Example: A cloud computing learner might be introduced to DevOps or Kubernetes

### Why Recommend Reason Matters

Each recommendation includes a `recommendation_reason` and `recommendation_type` field. These are surfaced in the UI so users understand *why* a course was suggested — improving trust and click-through.

---

## 6. Data Flow Summary

```
User types query
     ↓
Preferences fetched from UserPreference entity
     ↓
Prompt constructed with query + preferences
     ↓
LLM called with internet search enabled
     ↓
Structured JSON courses returned
     ↓
Courses displayed → Client-side platform filter applied
     ↓
User saves a course → SavedCourse entity created
     ↓
SearchHistory + Course entities persisted
     ↓
Recommendations engine reads history + saved + preferences
     ↓
Hybrid LLM prompt generated → Personalized courses returned
```

---

## 7. Security & Data Isolation

All entities (`SearchHistory`, `SavedCourse`, `Course`) are filtered by `created_by: user.email` at the query level. This ensures:
- Users only see their own search history, saved courses, and discovered courses
- No cross-user data leakage even if entity records exist in the same collection

---

## 8. Limitations & Notes

- **URLs are AI-generated**: Course URLs are realistic estimates based on platform URL patterns. They may occasionally point to a wrong or outdated listing. Always verify on the platform.
- **Ratings are estimates**: If exact ratings are unavailable via web search, the LLM provides realistic approximations based on known course quality signals.
- **No static index**: CourseIQ does not maintain a database of all courses. Discovery is dynamic and fresh on every search.
- **LLM model**: Uses Base44's default model (`gpt-4o-mini` equivalent) for standard searches. The recommendation engine uses the same model with a richer context window.
