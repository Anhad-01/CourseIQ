import hashlib
import math

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Course, CourseEmbedding
from .ranking import tokenize


VECTOR_DIMENSIONS = 128


def course_text(course: dict | Course) -> str:
    get = course.get if isinstance(course, dict) else lambda key: getattr(course, key)
    return " ".join(
        str(get(key) or "")
        for key in ["course_title", "description", "category", "skill_level", "platform", "instructor"]
    )


def token_index(token: str) -> int:
    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % VECTOR_DIMENSIONS


def embed_text(text: str) -> list[float]:
    vector = [0.0] * VECTOR_DIMENSIONS
    for token in tokenize(text):
        vector[token_index(token)] += 1.0

    magnitude = math.sqrt(sum(value * value for value in vector))
    if magnitude == 0:
        return vector
    return [round(value / magnitude, 6) for value in vector]


def cosine_similarity(left: list[float] | None, right: list[float] | None) -> float:
    if not left or not right:
        return 0.0
    return sum(a * b for a, b in zip(left, right))


def upsert_course_embedding(db: Session, course: Course) -> CourseEmbedding:
    vector = embed_text(course_text(course))

    for pending in db.new:
        if isinstance(pending, CourseEmbedding) and pending.course_id == course.id:
            pending.vector = vector
            return pending

    embedding = db.get(CourseEmbedding, course.id)
    if embedding is None:
        embedding = CourseEmbedding(course_id=course.id, vector=vector)
        db.add(embedding)
    else:
        embedding.vector = vector
    return embedding


def load_embedding_map(db: Session, courses: list[Course]) -> dict[str, list[float]]:
    unique_courses = list({course.id: course for course in courses}.values())
    embeddings = db.scalars(
        select(CourseEmbedding).where(CourseEmbedding.course_id.in_([course.id for course in unique_courses])),
    ).all()
    by_course_id = {embedding.course_id: embedding.vector for embedding in embeddings}

    missing = [course for course in unique_courses if course.id not in by_course_id]
    for course in missing:
        embedding = upsert_course_embedding(db, course)
        by_course_id[course.id] = embedding.vector

    return by_course_id
