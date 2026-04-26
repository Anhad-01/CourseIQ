# CourseMind AI: ML Architecture & Pipeline Implementation Plan

## Project Overview
CourseMind AI is an intelligent Software-as-a-Service (SaaS) platform designed to aggregate, filter, and recommend educational courses from leading providers (Coursera, Udemy, NPTEL, edX, Khan Academy, LinkedIn Learning, and FutureSkills Prime). Moving beyond standard API wrappers, the platform leverages a distributed, agentic Machine Learning architecture to dynamically retrieve courses, bypass static scraping limitations, and deliver hyper-personalized learning paths through a hybrid recommendation engine.

This document outlines the step-by-step action plan for building the two core AI/ML pipelines powering the platform.

---

## Pipeline 1: Agentic Course Retrieval & Re-Ranking
This pipeline activates when a user submits a search query. It is responsible for parsing intent, distributing scraping tasks to autonomous agents, and mathematically re-ranking the results based on relevance and user constraints.

### Phase 1.1: Query Understanding & Orchestration
1. **Context Retrieval:** The Orchestrator agent queries the user database to retrieve explicit preferences (e.g., budget limits, preferred platforms).
2. **Task Distribution:** Based on the user's saved platform preferences, the Orchestrator spins up parallel, asynchronous scraping jobs targeted strictly at the approved websites.

### Phase 1.2: Distributed Web Scraping Agents
1. **Adaptive DOM Parsing:** Implement Vision-Language or Adaptive DOM Agents using headless Chromium (Playwright/Selenium). These agents do not rely on static CSS classes, which frequently change. Instead, they use structural analysis to identify course containers.
2. **Data Normalization:** As raw HTML or JSON is retrieved, the agents pass the data through a normalization layer. This ensures every course conforms to a strict schema: Title, Instructor, Rating, Price, Duration, URL, and Category.

### Phase 1.3: Two-Stage Re-Ranking Engine
Instead of relying on basic keyword matching, implement a deterministic scoring model.

* **Stage A (Semantic Scoring):** Pass the normalized course descriptions and the user's parsed query through a pre-trained Cross-Encoder (e.g., `ms-marco-MiniLM`) to generate a highly accurate semantic similarity score.
* **Stage B (Multi-Objective Optimization):** Combine the semantic score with hard user constraints using a weighted scoring function.

**Re-Ranking Formula:**
`S_total = (a * Similarity) + (b * Normalized_Rating) - (c * Budget_Penalty) + (d * Skill_Match)`

* `Similarity`: Cross-encoder score (0 to 1).
* `Normalized_Rating`: Platform rating scaled to 0-1.
* `Budget_Penalty`: A decay penalty applied if the course price exceeds the user's budget.
* `Skill_Match`: A binary multiplier (1 or 0.5) depending on whether the course level matches the user's preferred level.
* `a, b, c, d`: Tunable hyperparameters adjusted via offline A/B testing.

---

## Pipeline 2: Hybrid Recommendation Engine
This pipeline runs asynchronously to populate the user's dashboard with personalized course suggestions. It uses an ensemble approach, combining Content-Based Filtering (CBF) and Collaborative Filtering (CF).

### Phase 2.1: Content-Based Filtering (CBF) Branch
This branch suggests courses similar to what the user has already explored.
1. **Vectorization:** Use an embedding model (e.g., HuggingFace Sentence Transformers) to convert course descriptions, titles, and categories into dense vectors. This vectorisation will run instantly in the backend on all the suggested courses for a search
2. **Storage:** Store these vectors in a dedicated Vector Database (e.g., Pinecone, Milvus, or pgvector).
3. **Retrieval:** When generating recommendations, take the vectors of the user's currently saved courses and perform a Cosine Similarity search in the Vector DB to find nearest neighbors.

### Phase 2.2: Collaborative Filtering (CF) Branch
This branch suggests courses based on the interaction patterns of similar users.
1. **Implicit Feedback Matrix:** Construct a User-Item interaction matrix. Since explicit 1-5 star ratings are not available, use implicit signals derived from the saved course tags.
2. **Interaction Weighting:** Assign progressive weights to interactions to signal intent strength:
    * `Search Click`: Weight = 1
    * `bookmarked`: Weight = 3
    * `in_progress`: Weight = 5
    * `completed`: Weight = 8
3. **Matrix Factorization:** Apply an algorithm like Alternating Least Squares (ALS) to identify latent user features. If User A and User B share similar "completed" and "in_progress" histories, User B's highly weighted courses are recommended to User A.

### Phase 2.3: The Final Ranker (Gradient Boosting)
1. **Aggregation:** Feed the scores from the CBF and CF branches, along with contextual features (user budget, time since last login), into a machine learning model like XGBoost or LightGBM.
2. **Prediction:** The model calculates the "Probability of Save" for a candidate list of courses.
3. **Serendipity Injection:** To prevent echo chambers, artificially inject 10-15% of high-quality, adjacent-topic courses into the final sorted list using an exploration algorithm (e.g., Multi-Armed Bandit). This introduces the user to new, relevant domains.
