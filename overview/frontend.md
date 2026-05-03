# Frontend

The CourseIQ frontend is a React-based SPA connected to the FastAPI backend.

## Tech Stack

| Category | Technology |
|----------|-------------|
| UI Framework | React 18.3.1 |
| Build Tool | Vite 5.4.10 |
| Routing | React Router DOM 6.28.0 |
| Styling | Tailwind CSS 3.4.15 |
| UI Components | Radix UI Primitives |
| Animations | Framer Motion 11.11.11 |
| State Management | TanStack React Query 5.59.16 |
| Icons | Lucide React |
| Notifications | Sonner |

## Project Structure

```
frontend/
├── src/
│   ├── main.jsx          # App entry point
│   ├── App.jsx           # Main router configuration
│   ├── api/              # API integration (empty)
│   ├── components/
│   │   ├── ui/           # Radix UI primitives
│   │   ├── dashboard/    # Dashboard components
│   │   ├── layout/       # Layout components
│   │   └── search/       # Search components
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── SearchPage.jsx
│   │   ├── Recommendations.jsx
│   │   ├── SavedCourses.jsx
│   │   ├── Settings.jsx
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   └── lib/
│       ├── apiClient.js   # Axios client
│       ├── AuthContext.jsx
│       ├── query-client.js
│       └── utils.js
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

## Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | LoginPage | User authentication |
| `/register` | RegisterPage | New user registration |
| `/` | SearchPage | Course search (default) |
| `/dashboard` | Dashboard | Dashboard overview |
| `/recommendations` | Recommendations | AI-powered recommendations |
| `/saved` | SavedCourses | Saved/bookmarked courses |
| `/settings` | Settings | User preferences |

## API Integration

The frontend uses an Axios-based client configured in `src/lib/apiClient.js`. It communicates with the FastAPI backend at `http://localhost:8000` by default.

### Authentication Flow

- Login/register return JWT tokens
- Tokens are stored and attached to subsequent requests via Bearer token
- AuthContext manages authentication state

### Query Client

TanStack React Query is used for server state management, caching, and request optimization.

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

Create a `.env` file in the frontend directory:

```bash
VITE_API_URL=http://localhost:8000
```