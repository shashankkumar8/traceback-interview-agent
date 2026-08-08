# TRACEBACK

**The interviewer that doesn't just hear your answer. It investigates your understanding.**

ABTalks Vibe Code Hackathon — Problem Statement 2: The Interview Agent

---

## What It Does

Generic interview chatbots ask scripted questions and move on. TRACEBACK behaves like an experienced technical interviewer: every answer becomes evidence, and the system investigates claims with increasing specificity until genuine understanding — or its absence — is revealed.

When a candidate says *"We used RAG with Pinecone for semantic search"*, TRACEBACK does not jump to unrelated topics. It probes:

- What was retrieved and why?
- What retrieval metrics did you monitor?
- Where was the bottleneck in the pipeline?
- Why RAG instead of fine-tuning?

Candidates who understand the topic survive increasing depth. Surface answers trigger professional follow-ups.

---

## UI Overview (v2 — Hackathon Demo)

The frontend is a four-screen single-page app optimized for live demo visibility.

### Screen 1 — Candidate Selection
- Sorted list of 20 real candidates from the hackathon dataset
- Role-color-coded avatars, experience, and live mission completion bars
- Detail panel: curriculum history, signals, education — no internal scores exposed

### Screen 2 — Interview Brief
- Preparation screen shown before the interview begins
- Algorithmically derived focus areas from curriculum history (skipped modules, high-attempt missions, role-specific probes)
- Tags: CORE / GAP / VERIFY / PROBE — safe labels, no raw scoring

### Screen 3 — Interview (two-column layout)
**Left panel:**
- Candidate identity + experience
- Live stage indicator with pulse animation
- TRACEBACK Pipeline Visualizer: `Answer → Analysis → Traceback → Follow-Up` with active step highlighting
- Knowledge dimension coverage grid (8 dimensions, lights up as explored)

**Right panel:**
- Chat thread with interviewer and candidate bubbles
- Animated typing indicator while TRACEBACK analyzes
- Rotating loading steps: `Analyzing reasoning...` → `Mapping technologies vs claims...` → `Identifying knowledge gaps...` → `Formulating adaptive follow-up...`
- Ctrl+Enter submit, character counter, error banner with Retry

### Screen 4 — Feedback
- Overall assessment paragraph
- Competency coverage chart (8 dimensions with fill bar)
- Strengths / Knowledge Gaps columns
- Recommended next steps grid

### Demo Reliability
If the backend or LLM is unavailable, the app auto-detects this and activates **Offline Demo Mode** — a scripted 3-turn interview per candidate using realistic questions and feedback. Clearly labelled. Does not fake real evaluation results. The live API path is unaffected.

---

## Architecture

```
traceback/
├── backend/
│   └── app/
│       ├── api/          # POST /api/interview, GET /api/candidates
│       ├── interview/    # Engine, evidence extractor, question strategy, evaluator
│       ├── llm/          # Provider abstraction (mock + OpenAI-compatible)
│       ├── models/       # Pydantic schemas (InterviewState, Feedback, etc.)
│       ├── services/     # Curriculum loader + candidate profile analysis
│       └── storage/      # In-memory session store
├── frontend/
│   └── src/
│       ├── App.jsx                      # useReducer state machine, 4 screens
│       ├── components/
│       │   ├── CandidateSelect.jsx      # Candidate list + profile detail
│       │   ├── InterviewBrief.jsx       # Pre-interview preparation screen
│       │   ├── InterviewLayout.jsx      # Two-column interview view
│       │   ├── TracebackVisualizer.jsx  # Pipeline step indicator
│       │   └── FeedbackScreen.jsx       # Assessment results
│       └── index.css                    # Full design system
└── organizer/            # Authoritative hackathon data
```

---

## Interview Flow

1. **Profile Analysis** — Role, experience, mission history (passed/failed/skipped/attempts)
2. **Adaptive Questioning** — Curriculum-aligned topics prioritized per candidate weakness
3. **Evidence Extraction** — Technologies, metrics, tradeoffs, depth classification per answer
4. **TRACEBACK Probing** — Follow-up probes on vague or surface-level claims
5. **Final Evaluation** — Evidence-based feedback: strengths, gaps, next steps

Target: **8–12 meaningful questions** including follow-ups.

---

## API Contract

```http
POST /api/interview
GET  /api/candidates
GET  /api/curriculum
GET  /health
```

### Start interview

```json
{ "sessionId": "abc-123", "candidate": { "...full candidate object..." } }
```

### Continue

```json
{ "sessionId": "abc-123", "message": "candidate response text" }
```

### Response shape (every turn)

```json
{
  "reply": "Follow-up question text",
  "done": false,
  "progress": {
    "questionNumber": 3,
    "totalQuestions": 10,
    "stage": "FOLLOW_UP",
    "areasExplored": [
      { "name": "Fundamentals", "explored": true },
      { "name": "Implementation", "explored": true },
      ...
    ]
  }
}
```

### On completion (`done: true`)

```json
{
  "reply": "Interview completed.",
  "done": true,
  "feedback": {
    "summary": "...",
    "strengths": ["..."],
    "gaps": ["..."],
    "next": ["..."]
  },
  "progress": { "stage": "COMPLETED", "..." }
}
```

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
copy ..\.env.example ..\.env    # configure LLM provider (optional)
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # dev server at http://localhost:5173
# or
npm run build    # production build → frontend/dist/ (served by FastAPI)
```

### Production (single process)

The FastAPI server serves the built frontend from `frontend/dist/` automatically. Build the frontend first, then start only the backend:

```bash
cd frontend && npm run build
cd ../backend
uvicorn app.main:app --port 8000
```

Open http://localhost:8000

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `LLM_PROVIDER` | `mock` | `mock`, `openai`, `groq`, `ollama` |
| `LLM_MODEL` | `gpt-4o-mini` | Model name for the chosen provider |
| `LLM_API_KEY` | — | API key (omit to use mock mode) |
| `LLM_BASE_URL` | — | Custom base URL for OpenAI-compatible APIs |
| `MOCK_LLM` | `true` | Force mock LLM regardless of other settings |
| `TARGET_QUESTIONS` | `10` | Questions before interview completes |
| `MAX_MESSAGE_LENGTH` | `4000` | Max candidate answer length (chars) |

---

## Running Tests

```bash
cd backend
pytest -v
```

Tests cover: API endpoint correctness, session management, interview completion, follow-up triggering on surface answers, and evidence depth classification.

---

## Demo Walkthrough (Judges)

1. Open the app — the Candidate Selection screen loads with all 20 candidates
2. Select **Emily Chen** (AI Engineer, 6 yrs) — strong RAG/MCP history, one skipped module
3. Click **Generate Interview Brief** — see focus areas derived from her curriculum record
4. Click **Begin Assessment** — watch the TRACEBACK pipeline visualizer light up
5. Answer the first question (any response works in demo mode)
6. Watch `Analyzing reasoning...` → `Mapping technologies vs claims...` → `Identifying knowledge gaps...` cycle
7. The TRACEBACK Pipeline shows which step is active
8. After 3 turns the Feedback Screen shows structured assessment with competency coverage

**With live backend + LLM key:** the full adaptive engine runs, generating real follow-up probes based on actual answer content.

**Without backend (offline):** Demo Mode activates automatically, using scripted content. Clearly labelled in the header.

---

## Limitations

- Session storage is in-memory — resets on backend restart
- Mock LLM uses deterministic rule templates; real follow-ups require an LLM API key
- No streaming responses (full JSON per turn)

## License

Hackathon project — ABTalks Vibe Code 2026
