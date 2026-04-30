import asyncio
import re
from dataclasses import dataclass
from urllib.parse import quote_plus


PLATFORM_SEARCH_URLS = {
    "Coursera": "https://www.coursera.org/search?query={query}",
    "Udemy": "https://www.udemy.com/courses/search/?q={query}",
    "NPTEL": "https://nptel.ac.in/courses?search={query}",
    "edX": "https://www.edx.org/search?q={query}",
    "Khan Academy": "https://www.khanacademy.org/search?page_search_query={query}",
    "LinkedIn Learning": "https://www.linkedin.com/learning/search?keywords={query}",
    "FutureSkills Prime": "https://futureskillsprime.in/search?keyword={query}",
}


PLATFORM_HOST_HINTS = {
    "Coursera": "coursera.org",
    "Udemy": "udemy.com",
    "NPTEL": "nptel.ac.in",
    "edX": "edx.org",
    "Khan Academy": "khanacademy.org",
    "LinkedIn Learning": "linkedin.com/learning",
    "FutureSkills Prime": "futureskillsprime.in",
}


@dataclass(frozen=True)
class ScrapeResult:
    platform: str
    courses: list[dict]
    error: str | None = None


def platform_search_url(platform: str, query: str) -> str:
    template = PLATFORM_SEARCH_URLS[platform]
    return template.format(query=quote_plus(query))


def clean_text(value: str | None) -> str | None:
    if not value:
        return None
    return re.sub(r"\s+", " ", value).strip() or None


def parse_rating(text: str | None) -> float | None:
    if not text:
        return None
    match = re.search(r"([0-5](?:\.\d)?)\s*(?:/ ?5|stars?|rating)?", text, re.I)
    if not match:
        return None
    value = float(match.group(1))
    return value if 0 <= value <= 5 else None


def parse_price(text: str | None) -> str | None:
    if not text:
        return None
    lowered = text.lower()
    if "free" in lowered:
        return "Free"
    match = re.search(r"(?:₹|\$|rs\.?)\s?\d+(?:,\d{3})*(?:\.\d+)?", text, re.I)
    return match.group(0) if match else None


def parse_duration(text: str | None) -> str | None:
    if not text:
        return None
    match = re.search(
        r"\b\d+\s*(?:hours?|hrs?|weeks?|months?|days?)\b|self[- ]?paced",
        text,
        re.I,
    )
    return clean_text(match.group(0)) if match else None


def infer_skill_level(text: str | None) -> str | None:
    lowered = (text or "").lower()
    if any(token in lowered for token in ["advanced", "expert"]):
        return "Advanced"
    if "intermediate" in lowered:
        return "Intermediate"
    if any(token in lowered for token in ["beginner", "introductory", "introduction", "basic", "fundamentals"]):
        return "Beginner"
    return None


def infer_category(query: str, text: str | None) -> str:
    source = f"{query} {text or ''}".lower()
    categories = {
        "Machine Learning": ["machine learning", "ml", "supervised", "unsupervised"],
        "Artificial Intelligence": ["artificial intelligence", " ai ", "generative ai", "llm"],
        "Data Science": ["data science", "analytics", "statistics", "pandas", "numpy"],
        "Frontend Development": ["react", "frontend", "front-end", "javascript", "css"],
        "Programming Fundamentals": ["python", "data structures", "algorithms", "programming"],
        "DevOps": ["devops", "docker", "kubernetes", "cloud", "ci/cd"],
        "Design": ["design", "ux", "ui", "prototype"],
    }
    return next((category for category, tokens in categories.items() if any(token in source for token in tokens)), query.title())


def is_noisy_title(title: str, query: str) -> bool:
    compact = re.sub(r"\s+", "", title).lower()
    lowered = title.lower()
    query_lower = query.lower()
    noise_patterns = [
        r"^\d+[,\d]*results?for",
        r"^\d+[,\d]*results?",
        r"^results?for",
        r"^search results",
        r"^showing",
        r"^free courses?$",
        r"^for individuals$",
        r"^browse",
        r"^explore",
        r"^sign in$",
        r"^join now$",
    ]
    if any(re.search(pattern, compact if "results" in pattern else lowered) for pattern in noise_patterns):
        return True
    if query_lower and lowered.strip() in {query_lower, f"results for {query_lower}", f"courses for {query_lower}"}:
        return True
    if len(title.strip()) < 8:
        return True
    return bool(re.fullmatch(r"[\d,]+\s*(results?|courses?)?.*", lowered.strip()))


def is_probable_course_url(platform: str, url: str) -> bool:
    lowered = url.lower()
    if platform == "LinkedIn Learning":
        return "/learning/" in lowered and "/search" not in lowered
    if platform == "Coursera":
        return any(token in lowered for token in ["/learn/", "/specializations/", "/professional-certificates/"])
    if platform == "Udemy":
        return "/course/" in lowered
    if platform == "edX":
        return any(token in lowered for token in ["/learn/", "/course/", "/certificates/", "/program/"])
    if platform == "Khan Academy":
        return "/search" not in lowered
    if platform == "NPTEL":
        return "/courses/" in lowered or "nptel.ac.in" in lowered
    if platform == "FutureSkills Prime":
        return "/course" in lowered or "/program" in lowered or "futureskillsprime.in" in lowered
    return True


def normalize_scraped_course(platform: str, query: str, item: dict) -> dict | None:
    title = clean_text(item.get("title"))
    url = clean_text(item.get("url"))
    if not title or not url:
        return None
    if is_noisy_title(title, query) or not is_probable_course_url(platform, url):
        return None

    text = clean_text(" ".join(filter(None, [title, item.get("description"), item.get("metadata")])))
    return {
        "platform": platform,
        "course_title": title,
        "instructor": clean_text(item.get("instructor")),
        "rating": parse_rating(item.get("metadata")),
        "price": parse_price(item.get("metadata")) or "Check platform",
        "duration": parse_duration(item.get("metadata")),
        "url": url,
        "description": clean_text(item.get("description")) or f"Course result for {query} on {platform}.",
        "skill_level": infer_skill_level(text),
        "category": infer_category(query, text),
    }


async def extract_structural_courses(page, platform: str, query: str, limit: int = 8) -> list[dict]:
    host_hint = PLATFORM_HOST_HINTS[platform]
    raw_items = await page.evaluate(
        """
        ({ hostHint, limit }) => {
          const visibleText = (node) => (node?.innerText || node?.textContent || '').replace(/\\s+/g, ' ').trim();
          const anchors = Array.from(document.querySelectorAll('a[href]'));
          const scored = anchors
            .map((anchor) => {
              const href = anchor.href || '';
              const text = visibleText(anchor);
              const container = anchor.closest('article, li, section, div') || anchor;
              const containerText = visibleText(container);
              const heading = container.querySelector('h1,h2,h3,h4,[role="heading"]');
              const title = visibleText(heading) || text;
              const score = [
                href.includes(hostHint) ? 2 : 0,
                /course|learn|specialization|professional-certificate|program/i.test(href) ? 3 : 0,
                title.length >= 12 && title.length <= 120 ? 2 : 0,
                /rating|stars?|reviews?|hours?|weeks?|free|₹|\\$/i.test(containerText) ? 1 : 0,
              ].reduce((a, b) => a + b, 0);
              return { title, url: href, description: containerText.slice(0, 320), metadata: containerText, score };
            })
            .filter((item) => item.score >= 4 && item.title && item.url)
            .sort((a, b) => b.score - a.score);

          const seen = new Set();
          const unique = [];
          for (const item of scored) {
            const key = `${item.title.toLowerCase()}|${item.url.split('?')[0]}`;
            if (seen.has(key)) continue;
            seen.add(key);
            unique.push(item);
            if (unique.length >= limit) break;
          }
          return unique;
        }
        """,
        {"hostHint": host_hint, "limit": limit},
    )
    return [
        course
        for course in (normalize_scraped_course(platform, query, item) for item in raw_items)
        if course is not None
    ]


async def scrape_platform(browser, platform: str, query: str, timeout_ms: int = 12_000) -> ScrapeResult:
    page = await browser.new_page()
    try:
        await page.goto(platform_search_url(platform, query), wait_until="domcontentloaded", timeout=timeout_ms)
        await page.wait_for_timeout(1500)
        courses = await extract_structural_courses(page, platform, query)
        return ScrapeResult(platform=platform, courses=courses)
    except Exception as exc:
        return ScrapeResult(platform=platform, courses=[], error=str(exc))
    finally:
        await page.close()


async def scrape_platforms(query: str, platforms: list[str]) -> list[ScrapeResult]:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        return [ScrapeResult(platform=platform, courses=[], error="playwright_not_installed") for platform in platforms]

    async with async_playwright() as playwright:
        try:
            browser = await playwright.chromium.launch(headless=True)
        except Exception as exc:
            return [ScrapeResult(platform=platform, courses=[], error=str(exc)) for platform in platforms]
        try:
            return await asyncio.gather(
                *(scrape_platform(browser, platform, query) for platform in platforms if platform in PLATFORM_SEARCH_URLS),
            )
        finally:
            await browser.close()
