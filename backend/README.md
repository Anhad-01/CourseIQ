# CourseIQ Backend

FastAPI backend for CourseIQ search, persistence, auth, and recommendations.

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
cd ..
docker compose up -d db
cd backend
uvicorn app.main:app --reload
```

The Compose database is exposed on host port `5433` to avoid colliding with an existing local PostgreSQL on `5432`. Live scraping is enabled by default through `COURSEIQ_ENABLE_LIVE_SCRAPE=true`; if Chromium is unavailable, search falls back to the seeded catalog and still reranks results.

## Frontend wiring

Set this in `frontend/.env` if the backend is not running on the default URL:

```bash
VITE_API_URL=http://localhost:8000
```
