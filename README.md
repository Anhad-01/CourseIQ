# CourseIQ

An intelligent course discovery platform that aggregates, searches, and recommends educational courses from leading providers using AI-powered retrieval and hybrid recommendation engines.

## Supported Platforms

- Coursera
- Udemy
- NPTEL
- edX
- Khan Academy
- LinkedIn Learning
- FutureSkills Prime

## Tech Stack

### Frontend

- React 18 + Vite
- Tailwind CSS
- React Router DOM
- TanStack React Query
- Radix UI
- Framer Motion

### Backend

- FastAPI (Python)
- SQLAlchemy
- PostgreSQL / SQLite
- JWT Authentication
- Playwright (web scraping)

### ML Pipeline

- Hybrid Recommendation Engine (Content-Based + Collaborative Filtering)
- Two-Stage Re-Ranking (Semantic + Multi-Objective Optimization)
- Vector Embeddings for semantic search

See `overview/pipeline.md` for detailed ML architecture.

## Prerequisites

- Docker (for PostgreSQL)
- Python 3.11+
- Node.js 18+
- Playwright (for live scraping)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd courseiq
```

### 2. Start Database (Docker)

```bash
docker compose up -d db
```

The PostgreSQL database runs on port `5433` to avoid conflicts with local PostgreSQL on port `5432`.

### 3. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
uvicorn app.main:app --reload
```

The backend runs on `http://localhost:8000`.

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Environment Variables

### Backend

Copy `.env.example` to `.env` in the backend directory:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./courseiq.db` | Database connection |
| `JWT_SECRET` | - | JWT signing secret |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `JWT_EXPIRES_MINUTES` | `10080` | Token expiry (7 days) |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS origin |
| `COURSEIQ_ENABLE_LIVE_SCRAPE` | `false` | Enable live scraping |

### Frontend

Create `.env` in the frontend directory:

```bash
VITE_API_URL=http://localhost:8000
```

## Features

- **Course Search**: Semantic search with AI-powered re-ranking
- **Recommendations**: Hybrid recommendation engine (CBF + CF)
- **Saved Courses**: Bookmark, track progress, add notes
- **User Preferences**: Customize platform, skill level, budget, interests
- **Search History**: Track and revisit past searches
- **Live Scraping**: Real-time course data (optional)

## Project Structure

```
courseiq/
├── backend/           # FastAPI Python backend
│   ├── app/
│   │   ├── main.py   # Entry point
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── routers/  # API endpoints
│   │   └── services/ # Business logic
│   ├── requirements.txt
│   └── README.md
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   ├── package.json
│   └── vite.config.js
├── overview/         # Documentation
│   ├── frontend.md
│   ├── backend.md
│   ├── database.md
│   └── pipeline.md
├── docker-compose.yml
└── README.md
```

## API Documentation

Once the backend is running, visit:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Testing

```bash
cd backend
pytest
```