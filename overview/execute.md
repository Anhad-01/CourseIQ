# Execution Guide — CourseIQ

## Overview

This document covers how to run, develop, extend, and deploy CourseIQ. The application is built on the **Base44 platform**, so most infrastructure concerns (auth, database, AI, hosting) are managed for you.

---

## Prerequisites

| Requirement | Version / Notes |
|---|---|
| Node.js | v18+ recommended |
| npm | v9+ |
| Base44 Account | Required for platform services |
| Internet access | Required for AI web-search features |

---

## Local Development

### 1. Clone / Open the Project

Open the project in the Base44 editor. The platform automatically:
- Provides a live preview (hot-reload)
- Connects to the managed database
- Authenticates the developer as an admin user
- Makes all integrations available

### 2. Install Dependencies

Dependencies are pre-installed in the Base44 environment. If running locally with a custom Vite setup:

```bash
npm install
```

Key packages installed:
```
react, react-dom, react-router-dom
@tanstack/react-query
framer-motion
lucide-react
tailwindcss, tailwindcss-animate
@radix-ui/* (via shadcn/ui)
sonner
date-fns
```

### 3. Start the Dev Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (default Vite port).

### 4. Environment Variables

Base44 manages all secrets internally. No `.env` file is needed — API keys, database URLs, and integration credentials are injected by the platform.

If running outside Base44 (custom deployment), you would need:
```env
VITE_BASE44_APP_ID=your_app_id
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
```

---

## Project Structure Walkthrough

```
project-root/
├── index.html               # HTML entry point (title, favicon, meta)
├── index.css                # Global styles + CSS design tokens
├── tailwind.config.js       # Tailwind theme (maps CSS vars to utilities)
│
├── src/
│   ├── main.jsx             # React app mount point
│   ├── App.jsx              # Router + auth wrapper
│   │
│   ├── pages/               # One file per route
│   │   ├── SearchPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Recommendations.jsx
│   │   ├── SavedCourses.jsx
│   │   └── Settings.jsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.jsx
│   │   ├── search/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── CourseCard.jsx
│   │   │   ├── SearchSkeleton.jsx
│   │   │   └── PlatformFilter.jsx
│   │   ├── dashboard/
│   │   │   ├── StatCard.jsx
│   │   │   └── RecentSearches.jsx
│   │   └── ui/              # Shadcn/UI auto-generated components
│   │
│   ├── lib/
│   │   ├── courseSearchAgent.js   # AI search + recommendation functions
│   │   ├── AuthContext.jsx        # Base44 auth provider
│   │   ├── query-client.js        # React Query singleton
│   │   └── PageNotFound.jsx       # 404 component
│   │
│   └── api/
│       └── base44Client.js        # Pre-initialized Base44 SDK client
│
├── entities/                # Database schemas (JSON Schema format)
│   ├── Course.json
│   ├── SearchHistory.json
│   ├── SavedCourse.json
│   └── UserPreference.json
│
└── docs/                    # This documentation
    ├── frontend.md
    ├── backend.md
    ├── database.md
    └── execute.md
```

---

## Adding a New Page

1. Create `pages/NewPage.jsx`:
```jsx
export default function NewPage() {
  return <div>Hello World</div>;
}
```

2. Add the route to `App.jsx` (inside the `<Route element={<AppLayout />}>` block):
```jsx
import NewPage from '@/pages/NewPage';
// ...
<Route path="/new-page" element={<NewPage />} />
```

3. Optionally add a nav link in `components/layout/AppLayout.jsx`:
```js
const navItems = [
  // ... existing items
  { path: '/new-page', label: 'New Page', icon: SomeIcon },
];
```

---

## Adding a New Entity

1. Create `entities/NewEntity.json`:
```json
{
  "name": "NewEntity",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["active", "inactive"],
      "default": "active"
    }
  },
  "required": ["title"]
}
```

2. The entity is immediately available via the SDK:
```js
import { base44 } from '@/api/base44Client';

const items = await base44.entities.NewEntity.list();
await base44.entities.NewEntity.create({ title: 'Hello' });
```

---

## Adding a New AI Feature

Add a new function to `lib/courseSearchAgent.js`:

```js
export async function analyzeSkillGap(currentSkills, targetRole) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Given these skills: ${currentSkills.join(', ')}, 
             what courses should someone take to become a ${targetRole}?`,
    add_context_from_internet: true,
    response_json_schema: {
      type: "object",
      properties: {
        skill_gaps: { type: "array", items: { type: "string" } },
        recommended_courses: { type: "array", items: { /* schema */ } }
      }
    }
  });
  return result;
}
```

---

## Feature Implementation Checklist

### Course Rating & Review
- [ ] Add `Review` entity: `{ course_id, rating, review_text, helpful_count }`
- [ ] Add `ReviewCard` component
- [ ] Add review submission form to `CourseCard`
- [ ] Use aggregate ratings to improve recommendations

### Email Notifications
- [ ] Trigger `base44.integrations.Core.SendEmail` when:
  - New recommendations are generated
  - A course status changes to "completed"
- [ ] Weekly digest email summarizing new courses in saved topics

### Collaborative Filtering (Enhanced)
- [ ] Remove `created_by` scoping on `Course` entity reads (admin query or aggregate view)
- [ ] Fetch popular courses saved by multiple users
- [ ] Pass popularity signals to the recommendation prompt

### Course Comparison
- [ ] "Compare" selection on `CourseCard`
- [ ] `ComparisonPage` showing side-by-side table
- [ ] Use `InvokeLLM` to generate a prose comparison summary

### Learning Path Generator
- [ ] New page: `/learning-path`
- [ ] User inputs a goal (e.g., "Become a ML Engineer")
- [ ] AI generates an ordered sequence of courses
- [ ] Save as a `LearningPath` entity with ordered `course_ids`

---

## Deployment

### Via Base44 Platform (Default)
The Base44 editor handles deployment automatically:
1. All code changes are saved and hot-reloaded in preview
2. Click **"Publish"** in the Base44 dashboard to deploy to production
3. The app is hosted at `https://your-app.base44.app` (or custom domain)

### Custom Domain
1. Go to Base44 Dashboard → Settings → Domains
2. Add your domain and follow DNS configuration instructions
3. SSL is provisioned automatically

### Mobile App (iOS / Android)
Base44 supports mobile deployment from the same React codebase:
1. Dashboard → Publish → Mobile
2. Follow the PWA or native wrapper instructions
3. No code changes required — the app is already responsive

---

## Debugging

### Runtime Logs
View console errors, user actions, and network requests in the Base44 editor's **Logs** panel.

### Common Issues & Fixes

| Issue | Likely Cause | Fix |
|---|---|---|
| AI search returns empty | LLM prompt too vague or rate limit | Add more context to the prompt; retry |
| Courses not saving | User not authenticated | Check `created_by` is populated |
| Preferences not loading | No UserPreference record yet | Handle `prefs[0] \|\| {}` (already done) |
| Recommendations empty | No search history | Prompt user to do a few searches first |
| Tailwind class not applying | Dynamic class string | Add class to `tailwind.config.js` `safelist` |
| Component not found | Missing import or wrong path | Check `@/` alias resolves to `src/` |

### React Query DevTools
Add devtools for debugging query state:

```jsx
// In main.jsx or App.jsx (dev only)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Inside QueryClientProvider:
<ReactQueryDevtools initialIsOpen={false} />
```

---

## Performance Considerations

### AI Call Latency
- `InvokeLLM` with `add_context_from_internet: true` takes ~5–15 seconds
- Always show a loading skeleton (`SearchSkeleton`) during the call
- Consider caching repeated identical queries in the `Course` entity

### React Query Caching
- Default cache time: 5 minutes (stale), garbage collected after inactivity
- Override per-query with `staleTime` and `gcTime`:
```js
useQuery({
  queryKey: ['savedCourses'],
  queryFn: () => base44.entities.SavedCourse.list(),
  staleTime: 60_000,   // 1 minute
  gcTime: 300_000,     // 5 minutes
})
```

### Bundle Size
- Lucide React: import only used icons (`import { Search } from 'lucide-react'`)
- Framer Motion: only animate what's visible (use `AnimatePresence` for exit animations)
- Shadcn/UI: components are tree-shaken automatically

---

## Testing Strategy

### Unit Tests (Recommended)
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

Test targets:
- `courseSearchAgent.js` — mock `base44.integrations.Core.InvokeLLM`
- `CourseCard.jsx` — render with props, test save button click
- `PlatformFilter.jsx` — test filter change callback

### Integration Tests
- Test full search flow with mocked AI responses
- Test saved courses CRUD cycle

### End-to-End (Playwright)
```bash
npm install --save-dev playwright
npx playwright test
```

---

## Security Checklist

- [x] All entity reads are scoped to `created_by` (user's own data only)
- [x] Auth is enforced globally via `AuthProvider`
- [x] No API keys exposed in client-side code (managed by Base44)
- [x] External links use `rel="noopener noreferrer"`
- [ ] Input sanitization on search query (prevent prompt injection in AI calls)
- [ ] Rate limiting on AI calls (prevent abuse; add debounce on search)
- [ ] Admin-only routes (if adding admin dashboard)

---

## Roadmap Suggestions

| Priority | Feature | Complexity |
|---|---|---|
| High | Cache repeated AI searches (skip API call if same query < 1hr old) | Low |
| High | Course deduplication on bulk insert | Low |
| High | Analytics event tracking | Low |
| Medium | Email weekly digest | Medium |
| Medium | Learning path generator | Medium |
| Medium | Real-time collaboration (shared wishlists) | Medium |
| Low | Native mobile push notifications | High |
| Low | Chrome extension for course bookmarking | High |
| Low | PDF export of saved courses | Low |
