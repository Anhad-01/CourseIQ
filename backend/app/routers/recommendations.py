from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import Course, Interaction, SavedCourse, SearchHistory, User, UserPreference
from ..services.recommendations import recommend_courses
from ..services.retrieval import CATALOG
from ..services.serialization import course_to_dict, preference_to_dict, saved_course_to_dict, search_history_to_dict
from ..services.vector_store import load_embedding_map


router = APIRouter(tags=["recommendations"])


@router.post("/recommendations")
def recommendations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    preference = db.scalar(select(UserPreference).where(UserPreference.user_id == user.id))
    preferences = preference_to_dict(preference)
    history = db.scalars(
        select(SearchHistory).where(SearchHistory.user_id == user.id).order_by(SearchHistory.created_at.desc()).limit(20),
    ).all()
    saved = db.scalars(
        select(SavedCourse).where(SavedCourse.user_id == user.id).order_by(SavedCourse.updated_at.desc()),
    ).all()
    user_courses = db.scalars(select(Course).where(Course.user_id == user.id)).all()
    all_courses = db.scalars(select(Course)).all()
    interactions = db.scalars(select(Interaction)).all()

    candidates = [course_to_dict(course) for course in user_courses]
    seen_keys = {f"{course['platform']}-{course['course_title']}" for course in candidates}
    for item in CATALOG:
        key = f"{item['platform']}-{item['course_title']}"
        if key not in seen_keys:
            candidates.append({"id": key, **item})

    return recommend_courses(
        candidates,
        [search_history_to_dict(entry) for entry in history],
        [saved_course_to_dict(item) for item in saved],
        preferences,
        current_user_id=user.id,
        interactions=[
            {
                "user_id": interaction.user_id,
                "course_key": next(
                    (
                        f"{course.platform}::{course.course_title}".lower()
                        for course in all_courses
                        if course.id == interaction.course_id
                    ),
                    None,
                ),
                "weight": interaction.weight,
            }
            for interaction in interactions
        ],
        embedding_map=load_embedding_map(db, user_courses),
    )
