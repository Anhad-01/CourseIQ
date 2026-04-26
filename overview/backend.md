# Backend Architecture — CourseIQ

## Overview

CourseIQ's backend is powered entirely by the **Base44 platform**, which provides a managed Backend-as-a-Service (BaaS). There is no custom server, Node.js API, or Python FastAPI layer required — all backend concerns (auth, database CRUD, AI integration, real-time) are handled through the Base44 SDK.

---

## Backend Responsibilities

| Concern | How It's Handled |
|---|---|
| Authentication | Base44 Auth (session-based, managed) |
| User Management | Built-in `User` entity + `base44.auth` SDK |
| Database CRUD | `base44.entities.*` SDK methods |
| AI / LLM Calls | `base44.integrations.Core.InvokeLLM` |
| Web Search | `add_context_from_internet: true` flag on LLM calls |
| File Storage | `base44.integrations.Core.UploadFile` (if needed) |
| Real-time Updates | `base44.entities.*.subscribe()` |
| Analytics | `base44.analytics.track()` |

---

## Base44 SDK

The SDK is initialized once and imported throughout the app:

```js
import { base44 } from '@/api/base44Client';
```

The `base44Client` is a pre-configured singleton provided by the platform — no API keys or initialization code needed in the app.

---

## Authentication

### How it works
Base44 manages the full auth lifecycle:
- Login/signup pages are hosted by the platform
- After login, a session token is issued and stored
- `AuthProvider` (in `lib/AuthContext.jsx`) wraps the entire app and handles:
  - Session loading (`isLoadingAuth`)
  - Auth errors (`auth_required`, `user_not_registered`)
  - Automatic redirect to login on unauthenticated access

### Current User
```js
const user = await base44.auth.me();
// Returns: { id, email, full_name, role, ...customFields }
```

### Updating the Current User
```js
await base44.auth.updateMe({ learning_goal: '...' });
```

### Logout
```js
base44.auth.logout();              // Reload page
base44.auth.logout('/goodbye');    // Redirect to path
```

### Redirect to Login
```js
base44.auth.redirectToLogin('/dashboard');  // Returns here after login
```

### Auth Roles
- `admin` — full access to all entity records
- `user` — standard user, can only access their own records

---

## Entity SDK (Database Layer)

The entity SDK provides full CRUD operations. Each entity maps to a database collection.

### Method Reference

```js
// List all records (sorted, limited)
base44.entities.Course.list('-created_date', 50)

// Filter by field values
base44.entities.Course.filter({ platform: 'Coursera', skill_level: 'beginner' }, '-rating', 10)

// Create a single record
base44.entities.Course.create({ platform: 'Udemy', course_title: 'Python 101', ... })

// Bulk create multiple records
base44.entities.Course.bulkCreate([{ ... }, { ... }])

// Update by ID
base44.entities.Course.update(courseId, { rating: 4.8 })

// Delete by ID
base44.entities.Course.delete(courseId)

// Get JSON schema (for dynamic form rendering)
base44.entities.Course.schema()
```

### Auto-Populated Fields
Every entity record automatically includes:
- `id` — unique record identifier
- `created_date` — ISO timestamp of creation
- `updated_date` — ISO timestamp of last update
- `created_by` — email of the authenticated user who created the record

### Security Model
- Users can only read/write records where `created_by === their email`
- Admin users can access all records
- `User` entity: only admins can list/update/delete other users

---

## AI Integration

### `InvokeLLM`
The primary AI backend for CourseIQ. All AI calls go through this integration.

```js
const result = await base44.integrations.Core.InvokeLLM({
  prompt: "...",
  add_context_from_internet: true,   // Enables live web/Google search
  response_json_schema: { ... },     // Forces structured JSON output
  model: 'gemini_3_flash',           // Optional model override
});
```

**Available Models:**

| Model | Use Case |
|---|---|
| `automatic` | Default (GPT-4o-mini) — general queries |
| `gemini_3_flash` | Fast + supports web search |
| `gemini_3_1_pro` | High quality + supports web search |
| `claude_sonnet_4_6` | Complex reasoning tasks |
| `gpt_5` | High-quality generation |

> **Note:** Only `gemini_3_flash` and `gemini_3_1_pro` support `add_context_from_internet`. CourseIQ uses this for real-time course discovery.

### Course Search Agent (`lib/courseSearchAgent.js`)

#### `searchCoursesWithAI(query, preferences)`

```js
export async function searchCoursesWithAI(query, preferences = {}) {
  // 1. Builds prompt with user preferences (platform, budget, skill level)
  // 2. Calls InvokeLLM with web search enabled
  // 3. Returns array of normalized course objects
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Search for courses about "${query}"...`,
    add_context_from_internet: true,
    response_json_schema: {
      type: "object",
      properties: {
        courses: { type: "array", items: { /* course schema */ } }
      }
    }
  });
  return result.courses || [];
}
```

**Output format per course:**
```json
{
  "platform": "Coursera",
  "course_title": "Machine Learning Specialization",
  "instructor": "Andrew Ng",
  "rating": 4.9,
  "price": "Free to audit",
  "duration": "3 months",
  "url": "https://coursera.org/...",
  "description": "...",
  "skill_level": "beginner",
  "category": "Machine Learning"
}
```

#### `getRecommendations(searchHistory, savedCourses, preferences)`

```js
export async function getRecommendations(searchHistory, savedCourses, preferences) {
  // 1. Extracts recent search queries and saved course titles
  // 2. Builds a hybrid recommendation prompt
  // 3. Asks AI to reason about content-based + collaborative + discovery signals
  // 4. Returns recommendations with reason and type metadata
}
```

**Output format per recommendation:**
```json
{
  "platform": "edX",
  "course_title": "Deep Learning Fundamentals",
  "recommendation_type": "content-based",
  "recommendation_reason": "Matches your searches on Python and Machine Learning",
  ...
}
```

---

## Real-Time Subscriptions

Base44 supports real-time entity change streams:

```js
const unsubscribe = base44.entities.Course.subscribe((event) => {
  // event.type: 'create' | 'update' | 'delete'
  // event.id: record ID
  // event.data: full record data
  if (event.type === 'create') {
    setCourses(prev => [...prev, event.data]);
  }
});

// Cleanup
return unsubscribe;
```

> CourseIQ currently uses polling (React Query) rather than subscriptions, but subscriptions can be added for live collaborative features.

---

## Email Integration

```js
await base44.integrations.Core.SendEmail({
  to: 'user@example.com',
  subject: 'Your CourseIQ Recommendations',
  body: '<p>Here are your personalized courses...</p>',
  from_name: 'CourseIQ',
});
```

---

## Analytics

Track user behavior without PII:

```js
base44.analytics.track({
  eventName: 'course_search',
  properties: {
    query: 'Machine Learning',
    results_count: 10,
    platform_filter: 'Coursera',
  }
});
```

Recommended events to track in CourseIQ:
- `course_search` — on every AI search
- `course_saved` — on bookmark
- `recommendation_generated` — on rec fetch
- `course_link_clicked` — on external link open

---

## User Invitation

Admins can invite new users:

```js
await base44.users.inviteUser('newuser@example.com', 'user');
// Sends invite email; user registers via Base44 auth flow
```

---

## Error Handling

Base44 entity and integration methods are reliable and do not require try/catch. Errors propagate naturally and will appear in:
- Browser console
- Base44 runtime logs
- The app's error boundary (if configured)

---

## Extending the Backend

To add new backend functionality:

1. **New Entity** → Create `entities/NewEntity.json` with JSON schema
2. **New AI Feature** → Add a function to `lib/courseSearchAgent.js` using `InvokeLLM`
3. **New Integration** → Use available connectors (Google Sheets, Slack, Notion, etc.) via `base44.integrations`
4. **Scheduled Tasks** → Configure via Base44 dashboard (Builder+ plan)
5. **Webhooks / Custom Logic** → Use Base44 backend functions (Builder+ plan)
