from datetime import datetime

from pydantic import BaseModel, Field


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str = "user"


class AuthRequest(BaseModel):
    full_name: str | None = None
    email: str | None = None
    password: str = Field(min_length=6)


class AuthResponse(BaseModel):
    user: UserOut
    access_token: str
    token_type: str = "bearer"


class UserPreferenceIn(BaseModel):
    preferred_platforms: list[str] = []
    skill_level: str | None = None
    budget: str | None = None
    interests: list[str] = []
    learning_goal: str | None = None


class UserPreferenceOut(UserPreferenceIn):
    id: str | None = None


class CourseOut(BaseModel):
    id: str
    platform: str
    course_title: str
    instructor: str | None = None
    rating: float | None = None
    price: str | float | int | None = None
    duration: str | None = None
    url: str
    description: str | None = None
    skill_level: str | None = None
    category: str | None = None
    search_query: str | None = None
    image_url: str | None = None
    similarity_score: float | None = None
    ranking_score: float | None = None
    recommendation_type: str | None = None
    recommendation_reason: str | None = None
    recommendation_score: float | None = None
    source_course_id: str | None = None
    status: str | None = None
    saved_at: datetime | None = None
    updated_at: datetime | None = None


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=200)


class SearchHistoryOut(BaseModel):
    id: str
    query: str
    search_query: str
    results_count: int = 0
    platforms_searched: list[str] = []
    created_at: datetime


class SavedCourseCreate(BaseModel):
    course_id: str | None = None
    course: CourseOut | None = None


class SavedCoursePatch(BaseModel):
    status: str | None = None
    notes: str | None = None
