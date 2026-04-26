# Frontend Architecture — CourseIQ

## Overview

The frontend is built with **React 18** + **Tailwind CSS** + **Shadcn/UI**, running on the Base44 platform (Vite-based). It follows a component-driven architecture with a clean separation between pages, reusable components, and utility logic.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 (JSX) |
| Bundler | Vite |
| Styling | Tailwind CSS + CSS Variables |
| Component Library | Shadcn/UI (Radix UI primitives) |
| Routing | React Router DOM v6 |
| State & Data Fetching | TanStack React Query v5 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Fonts | Inter (body), Space Grotesk (headings) |

---

## Folder Structure

```
src/
├── App.jsx                        # Root router — all routes defined here
├── index.css                      # Design tokens (CSS variables) + Tailwind directives
├── tailwind.config.js             # Tailwind theme extending CSS tokens
│
├── pages/
│   ├── SearchPage.jsx             # Main AI-powered search interface
│   ├── Dashboard.jsx              # User dashboard with stats & history
│   ├── Recommendations.jsx        # Hybrid AI recommendation feed
│   ├── SavedCourses.jsx           # Bookmarked/tracked courses
│   └── Settings.jsx               # User preferences & profile
│
├── components/
│   ├── layout/
│   │   └── AppLayout.jsx          # Shared layout with nav (wraps all pages via <Outlet>)
│   ├── search/
│   │   ├── SearchBar.jsx          # Animated search input + submit button
│   │   ├── CourseCard.jsx         # Individual course result card
│   │   ├── SearchSkeleton.jsx     # Loading placeholder cards
│   │   └── PlatformFilter.jsx     # Badge-based platform filter tabs
│   └── dashboard/
│       ├── StatCard.jsx           # Metric summary card (stats row)
│       └── RecentSearches.jsx     # Scrollable list of past searches
│
├── lib/
│   ├── courseSearchAgent.js       # AI agent functions (search + recommendations)
│   ├── AuthContext.jsx            # Auth provider (Base44 built-in)
│   ├── query-client.js            # TanStack Query client singleton
│   └── PageNotFound.jsx           # 404 page
│
└── components/ui/                 # Shadcn/UI components (auto-generated)
    ├── button.jsx
    ├── card.jsx
    ├── badge.jsx
    ├── input.jsx
    ├── select.jsx
    ├── tabs.jsx
    ├── skeleton.jsx
    ├── checkbox.jsx
    ├── textarea.jsx
    └── ... (all other shadcn primitives)
```

---

## Routing (`App.jsx`)

All routes are nested under `AppLayout` which renders a shared top navigation bar via `<Outlet />`.

```
/                  → SearchPage        (AI search interface)
/dashboard         → Dashboard         (stats + history)
/recommendations   → Recommendations   (AI recommendation feed)
/saved             → SavedCourses       (bookmarked courses)
/settings          → Settings          (user preferences)
*                  → PageNotFound
```

### Route Guards
Auth is handled by `AuthProvider`. On every route load:
- If loading → shows a spinner
- If `auth_required` error → redirects to login
- If `user_not_registered` → shows `UserNotRegisteredError` component

---

## Pages

### `SearchPage.jsx`
The home page and primary feature.

**State:**
- `results` — array of course objects returned by the AI agent
- `isSearching` — boolean controlling skeleton loader
- `hasSearched` — toggles between hero/search mode
- `platformFilter` — active platform filter string

**Flow:**
1. User types a query and submits
2. `handleSearch()` calls `searchCoursesWithAI()` from `courseSearchAgent.js`
3. Results are displayed as `CourseCard` components
4. Search is saved to `SearchHistory` entity
5. Courses are bulk-saved to `Course` entity for caching

**Pre-search UI:** Hero section, trending topic chips, platform stats  
**Post-search UI:** Platform filter bar + course result list

---

### `Dashboard.jsx`
Data-driven overview of the user's learning activity.

**Data queries (parallel via React Query):**
- `SearchHistory` — last 20 searches
- `SavedCourse` — all saved courses
- `Course` — last 6 discovered courses
- `auth.me()` — current user name

**Components used:**
- `StatCard` × 4 — Total Searches, Saved, In Progress, Completed
- `RecentSearches` — clickable history list
- Quick Action cards (navigate to Search / Recommendations)
- Mini `CourseCard` list of recently discovered courses

---

### `Recommendations.jsx`
AI-powered personalized course feed.

**Flow:**
1. Shows explanation cards (Content-Based, Collaborative, Discovery)
2. On button click → calls `getRecommendations()` from `courseSearchAgent.js`
3. Each recommendation card shows a `recommendation_type` badge and `recommendation_reason` text
4. "Refresh" button re-runs the AI query

**Recommendation types:**
- `content-based` → Target icon
- `collaborative` → Users icon
- `discovery` → Lightbulb icon

---

### `SavedCourses.jsx`
Manages the user's bookmarked/tracked courses.

**Features:**
- Tabs filter by status: All / Bookmarked / In Progress / Completed
- Inline status change via `<Select>` (optimistic mutation)
- Delete course from saved list
- External link to course URL
- Uses `useMutation` for update/delete with query invalidation

---

### `Settings.jsx`
User preference management form.

**Form fields:**
- `preferred_platforms` — checkbox grid of 7 platforms
- `skill_level` — select: Beginner / Intermediate / Advanced
- `budget` — select: Free / Under $50 / Under $100 / Any
- `interests` — tag input (add/remove topic chips)
- `learning_goal` — free-text textarea

**Save logic:** Checks if a `UserPreference` record exists (update) or creates a new one.

---

## Components

### `AppLayout.jsx`
- Sticky top nav bar with logo, nav links, logout button
- Mobile hamburger menu with animated drawer (Framer Motion)
- Active route highlighted via `useLocation()`

### `SearchBar.jsx`
- Animated `whileFocusWithin` scale effect
- Two sizes: `large` (home hero) and `small` (results page)
- Disabled state during loading

### `CourseCard.jsx`
- Platform badge with color-coded styles per platform
- Rating (⭐), duration (🕐), price, skill level badges
- Bookmark toggle (filled/unfilled) with `onSave` callback
- External link button
- `index` prop drives staggered `Framer Motion` animation

### `PlatformFilter.jsx`
- Renders badge chips for each platform
- `selected` / `onChange` props for controlled filtering
- Stateless — filtering logic lives in `SearchPage`

### `StatCard.jsx`
- Accepts `icon`, `label`, `value`, `color`, `index`
- Color map: `primary`, `accent`, `chart3` (amber), `chart4` (purple)
- Staggered entrance animation

### `RecentSearches.jsx`
- Renders up to 8 recent searches with timestamp
- Each row is clickable → calls `onSearchAgain(query)`
- Empty state with link to Search page

---

## Design System

### Color Tokens (`index.css`)
All colors use HSL CSS variables mapped to Tailwind in `tailwind.config.js`.

| Token | Light | Usage |
|---|---|---|
| `--primary` | `234 89% 58%` (indigo) | Buttons, active states, accents |
| `--accent` | `172 66% 50%` (teal) | Secondary highlights |
| `--background` | `220 20% 97%` | Page background |
| `--card` | `0 0% 100%` | Card surfaces |
| `--muted` | `220 14% 94%` | Subtle backgrounds |
| `--foreground` | `224 71% 8%` | Primary text |
| `--muted-foreground` | `220 9% 46%` | Secondary text |

Dark mode tokens are defined in `.dark {}` class (same variables, different HSL values).

### Typography
- **Headings:** `font-heading` → Space Grotesk (imported from Google Fonts)
- **Body:** `font-body` → Inter

### Animation Patterns
- Page entrance: `opacity: 0 → 1`, `y: 20 → 0` (Framer Motion)
- Staggered lists: `delay: index * 0.05`
- Search bar: `whileFocusWithin` scale(1.01)
- Mobile nav: height/opacity transition

---

## Data Fetching Pattern

All data fetching uses **TanStack React Query**:

```js
const { data, isLoading } = useQuery({
  queryKey: ['uniqueKey'],
  queryFn: () => base44.entities.EntityName.list(),
});
```

Mutations use `useMutation` + `queryClient.invalidateQueries()` to keep data fresh.

Query keys used:
- `['searchHistory']`
- `['savedCourses']`
- `['preferences']`
- `['recentCourses']`
- `['me']`

---

## AI Integration (Frontend Layer)

The `lib/courseSearchAgent.js` module contains two async functions that call the Base44 `InvokeLLM` integration with `add_context_from_internet: true` (live web search):

### `searchCoursesWithAI(query, preferences)`
- Constructs a detailed prompt with platform/budget/level filters from preferences
- Returns array of normalized course objects: `{ platform, course_title, instructor, rating, price, duration, url, description, skill_level, category }`

### `getRecommendations(searchHistory, savedCourses, preferences)`
- Constructs a prompt using user's search history + saved titles + preferences
- Returns recommendations with `recommendation_type` and `recommendation_reason` fields
- Types: `content-based`, `collaborative`, `discovery`

---

## Notifications

Uses the **Sonner** toast library (`import { toast } from 'sonner'`):
- `toast.success('Course saved!')` — on bookmark
- `toast.success('Removed from saved')` — on unbookmark
- `toast.success('Preferences saved!')` — on settings save
