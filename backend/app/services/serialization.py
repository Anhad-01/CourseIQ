from .ranking import numeric_price
from ..models import Course, SavedCourse, SearchHistory, User, UserPreference


DEFAULT_PREFERENCES = {
    "preferred_platforms": ["Coursera", "Udemy", "NPTEL", "edX"],
    "skill_level": "Intermediate",
    "budget": "under_50",
    "interests": ["machine learning", "frontend", "python"],
    "learning_goal": "Build production-ready AI products and improve software engineering fundamentals.",
}


def user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
    }


def preference_to_dict(preference: UserPreference | None) -> dict:
    if preference is None:
        return {"id": None, **DEFAULT_PREFERENCES}

    return {
        "id": preference.id,
        "preferred_platforms": preference.preferred_platforms or [],
        "skill_level": preference.skill_level,
        "budget": preference.budget,
        "interests": preference.interests or [],
        "learning_goal": preference.learning_goal,
    }


def course_to_dict(course: Course) -> dict:
    return {
        "id": course.id,
        "platform": course.platform,
        "course_title": course.course_title,
        "instructor": course.instructor,
        "rating": course.rating,
        "price": course.price if course.price is not None else course.price_value,
        "duration": course.duration,
        "url": course.url,
        "description": course.description,
        "skill_level": course.skill_level,
        "category": course.category,
        "search_query": course.search_query,
        "image_url": course.image_url,
        "similarity_score": course.similarity_score,
        "ranking_score": course.ranking_score,
    }


def saved_course_to_dict(saved: SavedCourse) -> dict:
    data = dict(saved.snapshot or {})
    data.update(
        {
            "id": saved.id,
            "source_course_id": saved.course_id,
            "course_id": saved.course_id,
            "course_title": saved.course_title,
            "platform": saved.platform,
            "url": saved.url,
            "status": saved.status,
            "notes": saved.notes,
            "saved_at": saved.created_at,
            "updated_at": saved.updated_at,
        },
    )
    return data


def search_history_to_dict(entry: SearchHistory) -> dict:
    return {
        "id": entry.id,
        "query": entry.search_query,
        "search_query": entry.search_query,
        "results_count": entry.results_count,
        "platforms_searched": entry.platforms_searched or [],
        "created_at": entry.created_at,
    }


def normalize_course_payload(payload: dict) -> dict:
    price = payload.get("price")
    return {
        "platform": payload.get("platform") or "Unknown",
        "course_title": payload.get("course_title") or payload.get("title") or "Untitled course",
        "instructor": payload.get("instructor"),
        "rating": payload.get("rating"),
        "price": str(price) if price is not None else None,
        "price_value": numeric_price(price),
        "duration": payload.get("duration"),
        "url": payload.get("url") or "#",
        "description": payload.get("description"),
        "skill_level": payload.get("skill_level"),
        "category": payload.get("category"),
        "search_query": payload.get("search_query"),
        "image_url": payload.get("image_url"),
        "similarity_score": payload.get("similarity_score"),
        "ranking_score": payload.get("ranking_score"),
    }
