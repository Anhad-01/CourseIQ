from .ranking import budget_penalty, normalize_text, tokenize


ADJACENT_CATEGORIES = {
    "Machine Learning": ["Artificial Intelligence", "Data Science", "Deep Learning"],
    "Artificial Intelligence": ["Machine Learning", "Deep Learning", "AI Product Management"],
    "Data Science": ["Machine Learning", "Programming Fundamentals", "Deep Learning"],
    "Frontend Development": ["Design", "Programming Fundamentals"],
    "DevOps": ["Programming Fundamentals", "Artificial Intelligence"],
    "Design": ["Frontend Development", "AI Product Management"],
    "Programming Fundamentals": ["Frontend Development", "Data Science"],
}


def derive_signals(search_history: list[dict], saved_courses: list[dict], preferences: dict) -> list[str]:
    signals: list[str] = []
    for entry in search_history:
        signals.extend(tokenize(entry.get("search_query") or entry.get("query")))
    for course in saved_courses:
        signals.extend(tokenize(course.get("course_title")))
        signals.extend(tokenize(course.get("category")))
        signals.extend(tokenize(course.get("description")))
    for interest in preferences.get("interests") or []:
        signals.extend(tokenize(interest))
    return signals


def content_score(course: dict, signals: list[str], saved_courses: list[dict], preferences: dict) -> float:
    signal_set = set(signals)
    text = normalize_text(f"{course.get('course_title')} {course.get('description')} {course.get('category')}")
    keyword_matches = sum(1 for token in signal_set if token in text)
    category_match = 0.35 if any(item.get("category") == course.get("category") for item in saved_courses) else 0
    platform_boost = 0.1 if course.get("platform") in (preferences.get("preferred_platforms") or []) else 0
    rating_boost = float(course.get("rating") or 0) / 10
    return category_match + min(0.55, keyword_matches * 0.08) + platform_boost + rating_boost


def collaborative_score(course: dict, saved_courses: list[dict], preferences: dict) -> float:
    status_weight = 0.0
    for item in saved_courses:
        if item.get("platform") != course.get("platform"):
            continue
        status_weight += {"completed": 0.3, "in_progress": 0.2, "bookmarked": 0.1}.get(item.get("status"), 0.1)
    platform_boost = 0.2 if course.get("platform") in (preferences.get("preferred_platforms") or []) else 0
    return float(course.get("rating") or 0) / 5 + status_weight + platform_boost


def discovery_score(course: dict, saved_courses: list[dict], preferences: dict) -> float:
    seen_categories = {item.get("category") for item in saved_courses if item.get("category")}
    adjacent_hit = any(course.get("category") in ADJACENT_CATEGORIES.get(category, []) for category in seen_categories)
    novelty_boost = 0.05 if course.get("category") in seen_categories else 0.22
    budget_boost = 0.15 if budget_penalty(course, preferences) == 0 else 0
    return (0.45 if adjacent_hit else 0.18) + novelty_boost + budget_boost + float(course.get("rating") or 0) / 10


def reason_for(course: dict, recommendation_type: str) -> str:
    if recommendation_type == "content-based":
        return f"Matches your recent interest in {course.get('category')} and overlaps with saved-course topics."
    if recommendation_type == "collaborative":
        return f"Ranks well for learners with similar platform and progress patterns, with a rating of {course.get('rating')}."
    return f"Introduces a nearby topic in {course.get('category')} without drifting too far from your goals."


def recommend_courses(candidates: list[dict], search_history: list[dict], saved_courses: list[dict], preferences: dict) -> list[dict]:
    saved_ids = {item.get("source_course_id") or item.get("course_id") for item in saved_courses}
    saved_keys = {f"{item.get('platform')}-{item.get('course_title')}" for item in saved_courses}
    signals = derive_signals(search_history, saved_courses, preferences)
    allowed = preferences.get("preferred_platforms") or []
    scored = []

    for course in candidates:
        if course.get("id") in saved_ids or f"{course.get('platform')}-{course.get('course_title')}" in saved_keys:
            continue
        if allowed and course.get("platform") not in allowed:
            continue
        scores = {
            "content-based": content_score(course, signals, saved_courses, preferences),
            "collaborative": collaborative_score(course, saved_courses, preferences),
            "discovery": discovery_score(course, saved_courses, preferences),
        }
        recommendation_type, best_score = max(scores.items(), key=lambda item: item[1])
        scored.append(
            {
                **course,
                "recommendation_type": recommendation_type,
                "recommendation_reason": reason_for(course, recommendation_type),
                "recommendation_score": round(best_score, 3),
            },
        )

    grouped = [
        *[item for item in scored if item["recommendation_type"] == "content-based"][:3],
        *[item for item in scored if item["recommendation_type"] == "collaborative"][:2],
        *[item for item in scored if item["recommendation_type"] == "discovery"][:2],
    ]
    return sorted(grouped, key=lambda item: item["recommendation_score"], reverse=True)[:7]
