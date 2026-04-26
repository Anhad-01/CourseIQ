# Database Architecture — CourseIQ

## Overview

CourseIQ uses the **Base44 managed database** — a document-oriented store with relational querying capabilities. Schemas are defined as **JSON Schema** files in the `entities/` directory. The platform auto-provisions collections, enforces schemas, and handles indexing, backups, and scaling.

---

## Entity Schema Files

```
entities/
├── Course.json             # Aggregated course records from AI search
├── SearchHistory.json      # Log of user search queries
├── SavedCourse.json        # User's bookmarked/tracked courses
└── UserPreference.json     # Per-user learning preferences
```

> The `User` entity is built-in and does not require a schema file.

---

## Built-in Fields (All Entities)

Every record automatically contains:

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Unique record identifier |
| `created_date` | ISO datetime | When the record was created |
| `updated_date` | ISO datetime | When the record was last modified |
| `created_by` | string (email) | Email of the user who created it |

These are system-managed and cannot be set manually.

---

## Entity: `User` (Built-in)

Managed by Base44. No schema file needed.

| Field | Type | Editable | Notes |
|---|---|---|---|
| `id` | string | No | Auto-generated |
| `email` | string | No | Set at registration |
| `full_name` | string | No | Set at registration |
| `role` | string | Yes | `'admin'` or `'user'` (default) |
| `created_date` | datetime | No | Auto-set |

**Security:**
- Users can only view/update their own record
- Admins can list, update, and delete any user record
- Invite users via `base44.users.inviteUser(email, role)`

---

## Entity: `Course`

Stores normalized course records fetched by the AI search agent.

**File:** `entities/Course.json`

| Field | Type | Required | Description |
|---|---|---|---|
| `platform` | string | ✅ | Platform name (Udemy, Coursera, etc.) |
| `course_title` | string | ✅ | Full course title |
| `instructor` | string | | Instructor or organization |
| `rating` | number | | Rating out of 5.0 |
| `price` | string | | Price or "Free" |
| `duration` | string | | e.g., "8 hours", "4 weeks" |
| `url` | string | ✅ | Direct link to course page |
| `description` | string | | Short course description |
| `skill_level` | enum | | `beginner`, `intermediate`, `advanced`, `all_levels` |
| `category` | string | | Topic category (e.g., "Machine Learning") |
| `search_query` | string | | The search term that surfaced this course |
| `image_url` | string | | Course thumbnail image URL |

**Usage patterns:**
```js
// Bulk insert results from AI search
await base44.entities.Course.bulkCreate(courses.map(c => ({
  ...c,
  search_query: query
})));

// Fetch recent courses for dashboard
await base44.entities.Course.list('-created_date', 6);

// Find a specific course to get its ID (for SavedCourse reference)
await base44.entities.Course.filter({
  course_title: title,
  platform: platform
});
```

**Notes:**
- Courses are appended on every search (not deduplicated by default)
- `search_query` enables filtering courses by the original search term
- `created_by` scopes results to the current user automatically

---

## Entity: `SearchHistory`

Logs every AI search performed by the user.

**File:** `entities/SearchHistory.json`

| Field | Type | Required | Description |
|---|---|---|---|
| `search_query` | string | ✅ | The user's search input |
| `results_count` | number | | Number of courses returned |
| `platforms_searched` | array[string] | | List of platforms in the result set |

**Usage patterns:**
```js
// Save after every search
await base44.entities.SearchHistory.create({
  search_query: query,
  results_count: courses.length,
  platforms_searched: [...new Set(courses.map(c => c.platform))],
});

// Load recent search history for dashboard + recommendations
await base44.entities.SearchHistory.list('-created_date', 20);
```

**Notes:**
- Ordered by `created_date` descending for recency
- Used by the recommendation engine to infer user topic preferences
- `created_by` ensures each user only sees their own history

---

## Entity: `SavedCourse`

Tracks courses a user has bookmarked or is actively learning.

**File:** `entities/SavedCourse.json`

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `course_id` | string | ✅ | | Reference to `Course.id` (soft FK) |
| `course_title` | string | ✅ | | Cached title for fast display |
| `platform` | string | | | Cached platform name |
| `url` | string | | | Cached course URL |
| `status` | enum | | `bookmarked` | `bookmarked`, `in_progress`, `completed` |
| `notes` | string | | | User's personal notes |

**Relationship:**
- `course_id` references a `Course` record (soft foreign key — no enforced constraint)
- Course details are cached (`course_title`, `platform`, `url`) so the saved list renders without joining

**Status lifecycle:**
```
bookmarked → in_progress → completed
```

**Usage patterns:**
```js
// Bookmark a course
await base44.entities.SavedCourse.create({
  course_id: course.id,
  course_title: course.course_title,
  platform: course.platform,
  url: course.url,
  status: 'bookmarked',
});

// Update learning status
await base44.entities.SavedCourse.update(savedId, { status: 'in_progress' });

// Delete bookmark
await base44.entities.SavedCourse.delete(savedId);

// Check if a course is already saved (client-side)
const isSaved = savedCourses.some(
  sc => sc.course_title === course.course_title && sc.platform === course.platform
);
```

**Notes:**
- No `user_id` field needed — `created_by` handles user scoping
- Deduplication check is done client-side by matching `course_title + platform`
- `notes` field reserved for future personal annotation feature

---

## Entity: `UserPreference`

Stores a single preference record per user for recommendation personalization.

**File:** `entities/UserPreference.json`

| Field | Type | Description |
|---|---|---|
| `preferred_platforms` | array[string] | Selected platforms (e.g., `["Udemy", "Coursera"]`) |
| `skill_level` | enum | `beginner`, `intermediate`, `advanced` |
| `budget` | enum | `free`, `under_50`, `under_100`, `any` |
| `interests` | array[string] | Free-form topic tags (e.g., `["ML", "Python"]`) |
| `learning_goal` | string | User's stated learning objective |

**Usage patterns:**
```js
// Load preference (check if exists)
const prefs = await base44.entities.UserPreference.list();
const preference = prefs[0] || null;

// Create preference (first save)
await base44.entities.UserPreference.create(formData);

// Update existing preference
await base44.entities.UserPreference.update(preference.id, formData);
```

**Notes:**
- Only one record per user (enforced by app logic, not schema)
- All fields are optional — gracefully handled with `|| {}` defaults
- `interests` and `preferred_platforms` are stored as JSON arrays

---

## Equivalent SQL Schema (Reference)

For teams migrating to PostgreSQL/Prisma, here's the equivalent relational schema:

```sql
-- Users (managed by auth provider)
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT,
  role        TEXT DEFAULT 'user',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Courses (aggregated from AI agent)
CREATE TABLE courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by    TEXT REFERENCES users(email),
  platform      TEXT NOT NULL,
  course_title  TEXT NOT NULL,
  instructor    TEXT,
  rating        NUMERIC(3,1),
  price         TEXT,
  duration      TEXT,
  url           TEXT NOT NULL,
  description   TEXT,
  skill_level   TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
  category      TEXT,
  search_query  TEXT,
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Search history
CREATE TABLE search_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by          TEXT REFERENCES users(email),
  search_query        TEXT NOT NULL,
  results_count       INTEGER DEFAULT 0,
  platforms_searched  TEXT[],
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Saved / bookmarked courses
CREATE TABLE saved_courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by    TEXT REFERENCES users(email),
  course_id     UUID REFERENCES courses(id),
  course_title  TEXT NOT NULL,
  platform      TEXT,
  url           TEXT,
  status        TEXT DEFAULT 'bookmarked'
                CHECK (status IN ('bookmarked', 'in_progress', 'completed')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by           TEXT UNIQUE REFERENCES users(email),
  preferred_platforms  TEXT[],
  skill_level          TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  budget               TEXT CHECK (budget IN ('free', 'under_50', 'under_100', 'any')),
  interests            TEXT[],
  learning_goal        TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_courses_created_by ON courses(created_by);
CREATE INDEX idx_courses_search_query ON courses(search_query);
CREATE INDEX idx_search_history_user ON search_history(created_by);
CREATE INDEX idx_saved_courses_user ON saved_courses(created_by);
CREATE INDEX idx_saved_courses_status ON saved_courses(status);
CREATE UNIQUE INDEX idx_user_preferences_user ON user_preferences(created_by);
```

---

## Equivalent Prisma Schema (Reference)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  fullName      String?
  role          String    @default("user")
  createdAt     DateTime  @default(now())

  searches      SearchHistory[]
  savedCourses  SavedCourse[]
  preferences   UserPreference?
  courses       Course[]
}

model Course {
  id           String   @id @default(cuid())
  createdBy    String
  user         User     @relation(fields: [createdBy], references: [email])
  platform     String
  courseTitle  String
  instructor   String?
  rating       Float?
  price        String?
  duration     String?
  url          String
  description  String?
  skillLevel   String?
  category     String?
  searchQuery  String?
  imageUrl     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  savedAs      SavedCourse[]
}

model SearchHistory {
  id                String   @id @default(cuid())
  createdBy         String
  user              User     @relation(fields: [createdBy], references: [email])
  searchQuery       String
  resultsCount      Int      @default(0)
  platformsSearched String[]
  createdAt         DateTime @default(now())
}

model SavedCourse {
  id          String   @id @default(cuid())
  createdBy   String
  user        User     @relation(fields: [createdBy], references: [email])
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id])
  courseTitle String
  platform    String?
  url         String?
  status      String   @default("bookmarked")
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model UserPreference {
  id                  String   @id @default(cuid())
  createdBy           String   @unique
  user                User     @relation(fields: [createdBy], references: [email])
  preferredPlatforms  String[]
  skillLevel          String?
  budget              String?
  interests           String[]
  learningGoal        String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

---

## Data Flow Summary

```
User searches "Machine Learning"
        │
        ▼
SearchHistory record created  ──────────────────────────────────────┐
        │                                                           │
        ▼                                                           ▼
AI Agent (InvokeLLM)                                  Recommendation Engine reads
returns 8-12 courses                                  SearchHistory + SavedCourse
        │                                             to build hybrid prompt
        ▼
Course records bulk-created
(tagged with search_query)
        │
        ▼
User bookmarks a course
        │
        ▼
SavedCourse record created
(references Course.id,
 caches title/platform/url)
        │
        ▼
User status: bookmarked → in_progress → completed
(SavedCourse.status updated in-place)
``
