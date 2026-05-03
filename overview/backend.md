# Backend

The CourseIQ backend is a FastAPI-based Python application providing REST APIs for course search, user management, and AI-powered recommendations.

## Tech Stack

| Category | Technology |
|----------|-------------|
| Web Framework | FastAPI 0.115.6 |
| ASGI Server | Uvicorn 0.34.0 |
| ORM | SQLAlchemy 2.0.36 |
| Database | PostgreSQL 16 / SQLite |
| Authentication | JWT (python-jose) |
| Web Scraping | Playwright 1.49.1 |
| Validation | Pydantic |
| Testing | Pytest |

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI app entry point
│   ├── config.py         # Configuration settings
│   ├── database.py       # SQLAlchemy setup
│   ├── models.py         # Database models
│   ├── schemas.py        # Pydantic schemas
│   ├── security.py       # JWT utilities
│   ├── dependencies.py   # Auth dependencies
│   ├── routers/
│   │   ├── auth.py       # Authentication endpoints
│   │   ├── courses.py    # Course search endpoints
│   │   ├── preferences.py # User preferences
│   │   └── recommendations.py # AI recommendations
│   └── services/
│       ├── retrieval.py      # Course search/retrieval
│       ├── scraper_agents.py # Web scraping
│       ├── ranking.py         # Re-ranking algorithm
│       ├── recommendations.py  # Recommendation engine
│       ├── vector_store.py   # Vector embeddings
│       └── serialization.py
├── .env
├── .env.example
├── requirements.txt
└── README.md
```

## API Endpoints

### Authentication (`/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get JWT token |
| GET | `/auth/me` | Get current authenticated user |

### Courses (`/courses`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/courses/search` | Search courses by query |
| GET | `/courses/recent` | Get recent courses |

### Saved Courses (`/saved-courses`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/saved-courses` | List saved courses |
| POST | `/saved-courses` | Save a course |
| PATCH | `/saved-courses/{id}` | Update saved course |
| DELETE | `/saved-courses/{id}` | Delete saved course |

### Preferences (`/preferences`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/preferences` | Get user preferences |
| PUT | `/preferences` | Update preferences |
| GET | `/preferences/setup-complete` | Check if setup is complete |

### Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/recommendations` | Get AI recommendations |

### Search History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search-history` | Get search history |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

## Workflow

### Course Search & Reranking

```
User Query → Retrieval Service → Scraping/Catalog → Re-Ranking → User
                 ↓                                    ↓
           Vector Store ←─────── Semantic Similarity → Ranking Score
```

1. **Retrieval**: Uses vector embeddings to find semantically similar courses
2. **Scraping**: Live web scraping via Playwright (optional, enabled via env var)
3. **Re-ranking**: Two-stage ranking combining semantic similarity with multi-objective optimization

### Recommendation Engine

1. **Content-Based Filtering (CBF)**: Uses course vector embeddings to find similar courses
2. **Collaborative Filtering (CF)**: Builds user interaction matrix to find similar users
3. **Hybrid**: Combines CBF and CF for personalized recommendations

### Supported Platforms

- Coursera
- Udemy
- NPTEL
- edX
- Khan Academy
- LinkedIn Learning
- FutureSkills Prime

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./courseiq.db` | Database connection |
| `JWT_SECRET` | - | JWT signing secret |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `JWT_EXPIRES_MINUTES` | `10080` | Token expiry (7 days) |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS origin |
| `COURSEIQ_ENABLE_LIVE_SCRAPE` | `false` | Enable live scraping |

## Running the Backend

### With Docker (Recommended)

```bash
docker compose up -d db
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
uvicorn app.main:app --reload
```

### Running Tests

```bash
cd backend
pytest
```

The backend runs on `http://localhost:8000`.