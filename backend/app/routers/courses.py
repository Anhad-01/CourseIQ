from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Course, Interaction, SavedCourse, SearchHistory, User, UserPreference
from ..schemas import CourseOut, SavedCourseCreate, SavedCoursePatch, SearchHistoryOut, SearchRequest
from ..services.retrieval import retrieve_courses
from ..services.serialization import (
    course_to_dict,
    normalize_course_payload,
    preference_to_dict,
    saved_course_to_dict,
    search_history_to_dict,
)


router = APIRouter(tags=["courses"])


def upsert_course(db: Session, user: User, payload: dict) -> Course:
    values = normalize_course_payload(payload)
    for pending in db.new:
        if (
            isinstance(pending, Course)
            and pending.user_id == user.id
            and pending.platform == values["platform"]
            and pending.course_title == values["course_title"]
        ):
            for key, value in values.items():
                setattr(pending, key, value)
            return pending

    course = db.scalar(
        select(Course).where(
            Course.user_id == user.id,
            Course.platform == values["platform"],
            Course.course_title == values["course_title"],
        ),
    )
    if course is None:
        course = Course(user_id=user.id, **values)
        db.add(course)
    else:
        for key, value in values.items():
            setattr(course, key, value)
    return course


@router.post("/courses/search", response_model=list[CourseOut])
async def search_courses(
    payload: SearchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    preference = db.scalar(select(UserPreference).where(UserPreference.user_id == user.id))
    preferences = preference_to_dict(preference)
    settings = get_settings()
    ranked = await retrieve_courses(payload.query.strip(), preferences, settings.courseiq_enable_live_scrape)

    courses = []
    for item in ranked:
        course = upsert_course(db, user, {**item, "search_query": payload.query.strip()})
        courses.append(course)

    history = SearchHistory(
        user_id=user.id,
        search_query=payload.query.strip(),
        results_count=len(courses),
        platforms_searched=sorted({course.platform for course in courses}),
    )
    db.add(history)
    db.commit()
    for course in courses:
        db.refresh(course)
    return [course_to_dict(course) for course in courses]


@router.get("/courses/recent", response_model=list[CourseOut])
def recent_courses(
    limit: int = Query(6, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    courses = db.scalars(
        select(Course).where(Course.user_id == user.id).order_by(Course.updated_at.desc()).limit(limit),
    ).all()
    return [course_to_dict(course) for course in courses]


@router.get("/search-history", response_model=list[SearchHistoryOut])
def search_history(
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entries = db.scalars(
        select(SearchHistory)
        .where(SearchHistory.user_id == user.id)
        .order_by(SearchHistory.created_at.desc())
        .limit(limit),
    ).all()
    return [search_history_to_dict(entry) for entry in entries]


@router.get("/saved-courses")
def list_saved_courses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    saved = db.scalars(
        select(SavedCourse).where(SavedCourse.user_id == user.id).order_by(SavedCourse.updated_at.desc()),
    ).all()
    return [saved_course_to_dict(item) for item in saved]


@router.post("/saved-courses")
def create_saved_course(
    payload: SavedCourseCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    course = db.get(Course, payload.course_id) if payload.course_id else None
    if course is None and payload.course is not None:
        course = upsert_course(db, user, payload.course.model_dump())
        db.flush()
    if course is None or course.user_id != user.id:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = db.scalar(
        select(SavedCourse).where(SavedCourse.user_id == user.id, SavedCourse.course_id == course.id),
    )
    if existing:
        return saved_course_to_dict(existing)

    snapshot = course_to_dict(course)
    saved = SavedCourse(
        user_id=user.id,
        course_id=course.id,
        course_title=course.course_title,
        platform=course.platform,
        url=course.url,
        status="bookmarked",
        snapshot=snapshot,
    )
    db.add(saved)
    db.add(Interaction(user_id=user.id, course_id=course.id, event_type="bookmarked", weight=3))
    db.commit()
    db.refresh(saved)
    return saved_course_to_dict(saved)


@router.patch("/saved-courses/{saved_id}")
def update_saved_course(
    saved_id: str,
    payload: SavedCoursePatch,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saved = db.get(SavedCourse, saved_id)
    if not saved or saved.user_id != user.id:
        raise HTTPException(status_code=404, detail="Saved course not found")
    if payload.status is not None:
        if payload.status not in {"bookmarked", "in_progress", "completed"}:
            raise HTTPException(status_code=400, detail="Invalid status")
        saved.status = payload.status
        db.add(
            Interaction(
                user_id=user.id,
                course_id=saved.course_id,
                event_type=payload.status,
                weight={"bookmarked": 3, "in_progress": 5, "completed": 8}[payload.status],
            ),
        )
    if payload.notes is not None:
        saved.notes = payload.notes
    db.commit()
    db.refresh(saved)
    return saved_course_to_dict(saved)


@router.delete("/saved-courses/{saved_id}")
def delete_saved_course(saved_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    saved = db.get(SavedCourse, saved_id)
    if not saved or saved.user_id != user.id:
        raise HTTPException(status_code=404, detail="Saved course not found")
    db.delete(saved)
    db.commit()
    return {"ok": True}
