from .ranking import parse_intent, platform_allowed, rank_course


CATALOG = [
    {
        "platform": "Coursera",
        "course_title": "Machine Learning Specialization",
        "instructor": "Andrew Ng",
        "rating": 4.9,
        "price": 49,
        "duration": "3 months",
        "url": "https://www.coursera.org/specializations/machine-learning-introduction",
        "description": "Build ML foundations with supervised learning, advanced algorithms, and practical recommender systems.",
        "skill_level": "Beginner",
        "category": "Machine Learning",
    },
    {
        "platform": "Udemy",
        "course_title": "React - The Complete Guide",
        "instructor": "Maximilian Schwarzmüller",
        "rating": 4.7,
        "price": 19,
        "duration": "48 hours",
        "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/",
        "description": "Master React 18, routing, state management, animations, and production deployment patterns.",
        "skill_level": "Intermediate",
        "category": "Frontend Development",
    },
    {
        "platform": "NPTEL",
        "course_title": "Data Structures and Algorithms using Python",
        "instructor": "Prof. Madhavan Mukund",
        "rating": 4.6,
        "price": 0,
        "duration": "12 weeks",
        "url": "https://nptel.ac.in/",
        "description": "Learn algorithms, complexity, recursion, trees, and graphs with Python-based implementations.",
        "skill_level": "Beginner",
        "category": "Programming Fundamentals",
    },
    {
        "platform": "edX",
        "course_title": "CS50's Introduction to Artificial Intelligence with Python",
        "instructor": "David J. Malan",
        "rating": 4.8,
        "price": 0,
        "duration": "7 weeks",
        "url": "https://www.edx.org/learn/artificial-intelligence/harvard-university-cs50-s-introduction-to-artificial-intelligence-with-python",
        "description": "Explore search, optimization, machine learning, neural networks, and language models in Python.",
        "skill_level": "Intermediate",
        "category": "Artificial Intelligence",
    },
    {
        "platform": "LinkedIn Learning",
        "course_title": "Learning Docker",
        "instructor": "Ray Villalobos",
        "rating": 4.5,
        "price": 39,
        "duration": "2 hours 10 minutes",
        "url": "https://www.linkedin.com/learning/",
        "description": "Containerize applications, work with images, registries, volumes, and compose for developer workflows.",
        "skill_level": "Beginner",
        "category": "DevOps",
    },
    {
        "platform": "Khan Academy",
        "course_title": "Statistics and Probability",
        "instructor": "Khan Academy",
        "rating": 4.8,
        "price": 0,
        "duration": "Self paced",
        "url": "https://www.khanacademy.org/math/statistics-probability",
        "description": "Sharpen your data intuition with probability distributions, sampling, inference, and significance.",
        "skill_level": "Beginner",
        "category": "Data Science",
    },
    {
        "platform": "FutureSkills Prime",
        "course_title": "AI for Product Managers",
        "instructor": "NASSCOM",
        "rating": 4.4,
        "price": 29,
        "duration": "18 hours",
        "url": "https://futureskillsprime.in/",
        "description": "Understand AI strategy, product framing, experimentation, and deployment trade-offs for business teams.",
        "skill_level": "Intermediate",
        "category": "AI Product Management",
    },
    {
        "platform": "Coursera",
        "course_title": "Python for Data Science and Machine Learning Bootcamp",
        "instructor": "Jose Portilla",
        "rating": 4.6,
        "price": 24,
        "duration": "25 hours",
        "url": "https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/",
        "description": "Use NumPy, pandas, seaborn, scikit-learn, and machine learning workflows on practical datasets.",
        "skill_level": "Intermediate",
        "category": "Data Science",
    },
]


async def scrape_live_courses(query: str, platforms: list[str]) -> list[dict]:
    return []


async def retrieve_courses(query: str, preferences: dict, live_scrape: bool = False) -> list[dict]:
    intent = parse_intent(query)
    candidates = []

    if live_scrape:
        candidates.extend(await scrape_live_courses(query, preferences.get("preferred_platforms") or []))

    candidates.extend(CATALOG)
    ranked = [
        rank_course(course, intent, preferences)
        for course in candidates
        if platform_allowed(course, preferences)
    ]
    ranked = [
        course
        for course in ranked
        if course["similarity_score"] >= 0.18 or course["ranking_score"] >= 0.36
    ]
    return sorted(ranked, key=lambda item: (item["ranking_score"], item.get("rating") or 0), reverse=True)[:12]
