from collections import defaultdict

from .ranking import budget_penalty
from .vector_store import cosine_similarity, course_text, embed_text


ADJACENT_CATEGORIES = {
    "Machine Learning": ["Artificial Intelligence", "Data Science", "Deep Learning"],
    "Artificial Intelligence": ["Machine Learning", "Deep Learning", "AI Product Management"],
    "Data Science": ["Machine Learning", "Programming Fundamentals", "Deep Learning"],
    "Frontend Development": ["Design", "Programming Fundamentals"],
    "DevOps": ["Programming Fundamentals", "Artificial Intelligence"],
    "Design": ["Frontend Development", "AI Product Management"],
    "Programming Fundamentals": ["Frontend Development", "Data Science"],
    "Blockchain": ["Cybersecurity", "Cloud Computing", "Programming Fundamentals"],
}


INTERACTION_WEIGHTS = {
    "search_click": 1,
    "bookmarked": 3,
    "in_progress": 5,
    "completed": 8,
}


def course_key(course: dict) -> str:
    return f"{course.get('platform')}::{course.get('course_title')}".lower()


def saved_course_vector(saved_courses: list[dict]) -> list[float]:
    if not saved_courses:
        return []

    weighted_vectors = []
    for course in saved_courses:
        weight = INTERACTION_WEIGHTS.get(course.get("status"), 3)
        weighted_vectors.append((weight, embed_text(course_text(course))))

    total_weight = sum(weight for weight, _ in weighted_vectors) or 1
    centroid = [0.0] * len(weighted_vectors[0][1])
    for weight, vector in weighted_vectors:
        for index, value in enumerate(vector):
            centroid[index] += value * weight / total_weight
    return centroid


def content_based_scores(candidates: list[dict], saved_courses: list[dict], embedding_map: dict[str, list[float]]) -> dict[str, float]:
    centroid = saved_course_vector(saved_courses)
    if not centroid:
        return {}

    scores = {}
    for course in candidates:
        course_id = course.get("id")
        vector = embedding_map.get(course_id) or embed_text(course_text(course))
        scores[course_id] = round(cosine_similarity(centroid, vector), 4)
    return scores


def user_profile(interactions: list[dict]) -> dict[str, float]:
    profile: dict[str, float] = defaultdict(float)
    for interaction in interactions:
        key = interaction.get("course_key")
        if key:
            profile[key] += interaction.get("weight", 0)
    return dict(profile)


def profile_similarity(left: dict[str, float], right: dict[str, float]) -> float:
    common = set(left) & set(right)
    dot = sum(left[key] * right[key] for key in common)
    left_norm = sum(value * value for value in left.values()) ** 0.5
    right_norm = sum(value * value for value in right.values()) ** 0.5
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot / (left_norm * right_norm)


def collaborative_scores(candidates: list[dict], current_user_id: str, interactions: list[dict]) -> dict[str, float]:
    by_user: dict[str, list[dict]] = defaultdict(list)
    for interaction in interactions:
        by_user[interaction["user_id"]].append(interaction)

    current_profile = user_profile(by_user.get(current_user_id, []))
    if not current_profile:
        return {}

    candidate_keys = {course_key(course): course.get("id") for course in candidates}
    raw_scores: dict[str, float] = defaultdict(float)
    for user_id, user_interactions in by_user.items():
        if user_id == current_user_id:
            continue
        similarity = profile_similarity(current_profile, user_profile(user_interactions))
        if similarity <= 0:
            continue
        for interaction in user_interactions:
            candidate_id = candidate_keys.get(interaction.get("course_key"))
            if candidate_id:
                raw_scores[candidate_id] += similarity * interaction.get("weight", 0)

    max_score = max(raw_scores.values(), default=0)
    if max_score == 0:
        return {}
    return {course_id: round(score / max_score, 4) for course_id, score in raw_scores.items()}


def fallback_collaborative_score(course: dict, saved_courses: list[dict], preferences: dict) -> float:
    platform_hits = sum(1 for item in saved_courses if item.get("platform") == course.get("platform"))
    category_hits = sum(1 for item in saved_courses if item.get("category") == course.get("category"))
    preferred_platform = 1 if course.get("platform") in (preferences.get("preferred_platforms") or []) else 0
    rating = float(course.get("rating") or 0) / 5
    return min(1.0, 0.18 * platform_hits + 0.22 * category_hits + 0.15 * preferred_platform + 0.25 * rating)


def discovery_score(course: dict, saved_courses: list[dict], preferences: dict) -> float:
    seen_categories = {item.get("category") for item in saved_courses if item.get("category")}
    adjacent_hit = any(course.get("category") in ADJACENT_CATEGORIES.get(category, []) for category in seen_categories)
    novelty_boost = 0.03 if course.get("category") in seen_categories else 0.2
    budget_boost = 0.15 if budget_penalty(course, preferences) == 0 else 0
    return min(1.0, (0.45 if adjacent_hit else 0.12) + novelty_boost + budget_boost + float(course.get("rating") or 0) / 10)


def contextual_features(course: dict, preferences: dict, search_history: list[dict]) -> dict[str, float]:
    preferred_platform = 1.0 if course.get("platform") in (preferences.get("preferred_platforms") or []) else 0.0
    budget_fit = 1.0 - budget_penalty(course, preferences)
    recent_query_text = " ".join((entry.get("query") or entry.get("search_query") or "") for entry in search_history[:5]).lower()
    title = (course.get("course_title") or "").lower()
    recent_topic_hit = 1.0 if title and any(token in title for token in recent_query_text.split()) else 0.0
    rating = float(course.get("rating") or 0) / 5
    return {
        "preferred_platform": preferred_platform,
        "budget_fit": budget_fit,
        "recent_topic_hit": recent_topic_hit,
        "rating": rating,
    }


def probability_of_save(cbf: float, cf: float, discovery: float, context: dict[str, float]) -> float:
    score = (
        -0.9
        + 1.8 * cbf
        + 1.35 * cf
        + 0.55 * discovery
        + 0.45 * context["preferred_platform"]
        + 0.4 * context["budget_fit"]
        + 0.35 * context["recent_topic_hit"]
        + 0.5 * context["rating"]
    )
    return round(1 / (1 + pow(2.718281828, -score)), 4)


def reason_for(course: dict, recommendation_type: str) -> str:
    if recommendation_type == "content-based":
        return f"Similar to saved courses and interests around {course.get('category')}."
    if recommendation_type == "collaborative":
        return "Learners with similar saved and progress patterns engaged with this."
    return f"Adjacent {course.get('category')} topic added for discovery."


def inject_serendipity(scored: list[dict], desired_count: int = 7) -> list[dict]:
    if not scored:
        return []
    primary = [item for item in scored if item["recommendation_type"] != "discovery"]
    discovery = [item for item in scored if item["recommendation_type"] == "discovery"]
    target_discovery = max(1, round(desired_count * 0.15))

    result = primary[: max(0, desired_count - target_discovery)]
    for item in discovery[:target_discovery]:
        if item not in result:
            result.append(item)
    if len(result) < desired_count:
        for item in scored:
            if item not in result:
                result.append(item)
            if len(result) == desired_count:
                break
    return sorted(result, key=lambda item: item["recommendation_score"], reverse=True)


def recommend_courses(
    candidates: list[dict],
    search_history: list[dict],
    saved_courses: list[dict],
    preferences: dict,
    *,
    current_user_id: str,
    interactions: list[dict],
    embedding_map: dict[str, list[float]],
) -> list[dict]:
    saved_ids = {item.get("source_course_id") or item.get("course_id") for item in saved_courses}
    saved_keys = {course_key(item) for item in saved_courses}
    allowed = preferences.get("preferred_platforms") or []

    candidates = [
        course
        for course in candidates
        if course.get("id") not in saved_ids
        and course_key(course) not in saved_keys
        and (not allowed or course.get("platform") in allowed)
    ]

    cbf = content_based_scores(candidates, saved_courses, embedding_map)
    cf = collaborative_scores(candidates, current_user_id, interactions)

    scored = []
    for course in candidates:
        course_id = course.get("id")
        cbf_score = cbf.get(course_id, 0.0)
        cf_score = cf.get(course_id, fallback_collaborative_score(course, saved_courses, preferences))
        exploration_score = discovery_score(course, saved_courses, preferences)
        context = contextual_features(course, preferences, search_history)
        probability = probability_of_save(cbf_score, cf_score, exploration_score, context)
        branch_scores = {
            "content-based": cbf_score,
            "collaborative": cf_score,
            "discovery": exploration_score,
        }
        recommendation_type = max(branch_scores.items(), key=lambda item: item[1])[0]
        scored.append(
            {
                **course,
                "recommendation_type": recommendation_type,
                "recommendation_reason": reason_for(course, recommendation_type),
                "recommendation_score": probability,
                "cbf_score": round(cbf_score, 4),
                "cf_score": round(cf_score, 4),
                "discovery_score": round(exploration_score, 4),
                "probability_of_save": probability,
            },
        )

    scored.sort(key=lambda item: item["recommendation_score"], reverse=True)
    return inject_serendipity(scored, desired_count=7)
