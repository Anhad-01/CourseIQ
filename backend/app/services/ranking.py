import math
import re
from functools import lru_cache


QUERY_LEVEL_MAP = {
    "beginner": "Beginner",
    "basic": "Beginner",
    "introductory": "Beginner",
    "intermediate": "Intermediate",
    "advanced": "Advanced",
    "expert": "Advanced",
}


def normalize_text(value: str | None) -> str:
    return (value or "").lower().strip()


def tokenize(value: str | None) -> list[str]:
    return [token for token in re.split(r"[^a-z0-9+#]+", normalize_text(value)) if token]


def parse_intent(query: str) -> dict:
    tokens = tokenize(query)
    inferred = next((QUERY_LEVEL_MAP[token] for token in tokens if token in QUERY_LEVEL_MAP), None)
    return {"raw": query, "normalized": normalize_text(query), "tokens": tokens, "inferred_skill": inferred}


def numeric_price(value) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    lowered = str(value).lower()
    if "free" in lowered:
        return 0.0
    match = re.search(r"(\d+(?:\.\d+)?)", lowered.replace(",", ""))
    return float(match.group(1)) if match else None


def budget_limit(budget: str | None) -> float:
    if budget == "free":
        return 0.0
    if budget == "under_50":
        return 50.0
    if budget == "under_100":
        return 100.0
    return math.inf


def platform_allowed(course: dict, preferences: dict) -> bool:
    allowed = preferences.get("preferred_platforms") or []
    return not allowed or course.get("platform") in allowed


def semantic_similarity(course: dict, intent: dict) -> float:
    if not intent["tokens"]:
        return 0.4

    haystack = normalize_text(
        " ".join(
            str(value or "")
            for value in [
                course.get("course_title"),
                course.get("description"),
                course.get("category"),
                course.get("instructor"),
                course.get("skill_level"),
                course.get("platform"),
            ]
        ),
    )
    matches = sum(1 for token in intent["tokens"] if token in haystack)
    phrase_bonus = 0.28 if intent["normalized"] and intent["normalized"] in haystack else 0
    return min(1.0, matches / len(intent["tokens"]) + phrase_bonus)


@lru_cache(maxsize=1)
def get_cross_encoder():
    try:
        from sentence_transformers import CrossEncoder
    except ImportError:
        return None

    try:
        return CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    except Exception:
        return None


def course_semantic_text(course: dict) -> str:
    return " ".join(
        str(value or "")
        for value in [
            course.get("course_title"),
            course.get("description"),
            course.get("category"),
            course.get("skill_level"),
            course.get("instructor"),
            course.get("platform"),
        ]
    )


def cross_encoder_scores(query: str, courses: list[dict]) -> list[float] | None:
    encoder = get_cross_encoder()
    if encoder is None or not courses:
        return None

    try:
        raw_scores = encoder.predict([(query, course_semantic_text(course)) for course in courses])
    except Exception:
        return None

    return [1 / (1 + math.exp(-float(score))) for score in raw_scores]


def skill_match(course: dict, preferences: dict, intent: dict) -> float:
    preferred = preferences.get("skill_level") or intent.get("inferred_skill")
    if not preferred:
        return 1.0
    course_level = normalize_text(course.get("skill_level"))
    preferred_level = normalize_text(preferred)
    return 1.0 if course_level == preferred_level or course_level == "all_levels" else 0.5


def budget_penalty(course: dict, preferences: dict) -> float:
    limit = budget_limit(preferences.get("budget"))
    if not math.isfinite(limit):
        return 0.0
    price = numeric_price(course.get("price")) or 0.0
    if price <= limit:
        return 0.0
    return min(1.0, (price - limit) / max(limit or 25.0, 25.0))


def rank_course(course: dict, intent: dict, preferences: dict) -> dict:
    similarity = float(course.get("similarity_score") or semantic_similarity(course, intent))
    normalized_rating = float(course.get("rating") or 0) / 5
    penalty = budget_penalty(course, preferences)
    level_match = skill_match(course, preferences, intent)
    total = 0.62 * similarity + 0.2 * normalized_rating - 0.12 * penalty + 0.06 * level_match
    return {
        **course,
        "similarity_score": round(similarity, 3),
        "normalized_rating": round(normalized_rating, 3),
        "budget_penalty": round(penalty, 3),
        "skill_match": round(level_match, 3),
        "ranking_score": round(total, 3),
    }


def two_stage_rerank(query: str, courses: list[dict], preferences: dict) -> list[dict]:
    intent = parse_intent(query)
    semantic_scores = cross_encoder_scores(query, courses)

    stage_a = []
    for index, course in enumerate(courses):
        score = semantic_scores[index] if semantic_scores else semantic_similarity(course, intent)
        stage_a.append({**course, "similarity_score": round(score, 3)})

    stage_b = [rank_course(course, intent, preferences) for course in stage_a]
    return sorted(stage_b, key=lambda item: (item["ranking_score"], item.get("rating") or 0), reverse=True)
