from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import Base, engine
from .routers import auth, courses, preferences, recommendations


Base.metadata.create_all(bind=engine)

settings = get_settings()
app = FastAPI(title="CourseIQ API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(preferences.router)
app.include_router(courses.router)
app.include_router(recommendations.router)


@app.get("/health")
def health():
    return {"ok": True}
