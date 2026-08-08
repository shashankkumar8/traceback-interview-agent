# TRACEBACK

**The interviewer that doesn't just hear your answer. It investigates your understanding.**

ABTalks Vibe Code Hackathon — Problem Statement 2: The Interview Agent

---

## Problem Statement

Generic interview chatbots ask scripted questions and move on. TRACEBACK behaves like an experienced technical interviewer: every answer becomes evidence, and the system investigates claims with increasing specificity.

## Core Feature

When a candidate says *"We used RAG with Pinecone for semantic search"*, TRACEBACK does not jump to unrelated topics. It probes:

- What was retrieved and why?
- What retrieval metrics did you monitor?
- Where was the bottleneck in the pipeline?
- Why RAG instead of fine-tuning?

Candidates who understand the topic survive increasing depth. Surface answers trigger professional follow-ups.

## Architecture

```
traceback/
├── backend/           # FastAPI interview API
│   └── app/
│       ├── api/       # POST /api/interview
│       ├── interview/ # State machine, evidence, strategy, evaluator
│       ├── llm/       # Provider abstraction (mock + OpenAI-compatible)
│       ├── models/    # Typed Pydantic schemas
│       ├── services/  # Curriculum + candidate profile analysis
│       └── storage/   # In-memory session store
├── frontend/          # React + Vite interview UI
├── organizer/         # Authoritative hackathon data (spec, curriculum, candidates)
└── data/              # Optional copy of organizer data
```

## Interview Flow

1. **Profile Analysis** — Role, experience, mission history (passed/failed/skipped/attempts)
2. **Adaptive Questioning** — Curriculum-aligned topics prioritized per candidate
3. **Evidence Extraction** — Technologies, metrics, tradeoffs, depth classification
4. **Claim Investigation** — Follow-up probes on RAG, vectors, MCP, agents, etc.
5. **Final Evaluation** — Evidence-based feedback with strengths, gaps, and next steps

Target: **8–12 meaningful questions** including follow-ups.

## API Contract

```http
POST /api/interview
```

### Start interview

```json
{
  "sessionId": "abc-123",
  "candidate": { "...candidate.json" }
}
```

Response:

```json
{
  "reply": "Welcome. Let's begin your interview.",
  "done": false
}
```

### Continue

```json
{
  "sessionId": "abc-123",
  "message": "candidate response"
}
```

### Complete

```json
{
  "reply": "Interview completed.",
  "done": true,
  "feedback": {
    "summary": "...",
    "strengths": ["..."],
    "gaps": ["..."],
    "next": ["..."]
  }
}
```

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
copy ..\.env.example ..\.env  # optional
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `mock` | `mock`, `openai`, `groq`, `ollama` |
| `LLM_MODEL` | `gpt-4o-mini` | Model name for compatible providers |
| `LLM_API_KEY` | — | API key (mock mode used when empty) |
| `LLM_BASE_URL` | — | Custom base URL for OpenAI-compatible APIs |
| `MOCK_LLM` | `true` | Force mock LLM mode |
| `TARGET_QUESTIONS` | `10` | Questions before completion |
| `MAX_MESSAGE_LENGTH` | `4000` | Max candidate message length |

## Testing

```bash
cd backend
pytest -v
```

Tests cover:

- API endpoint correctness
- Session persistence by `sessionId`
- Interview completion with feedback schema
- Surface answers triggering follow-ups
- Evidence extraction depth classification

## Example Interview

1. Select **Emily Chen (AI Engineer)** — strong MCP/RAG history
2. First question targets RAG pipeline architecture
3. Answer with *"We used RAG with ChromaDB and top-k retrieval"*
4. TRACEBACK probes retrieval metrics and evaluation
5. After 8–10 turns, receive evidence-based feedback

## Screenshots

_Add screenshots after running locally._

## Limitations

- In-memory session storage (resets on server restart)
- Mock LLM mode uses deterministic rules; external LLM optional
- Mission title matching is fuzzy between candidate data and curriculum

## Future Improvements

- Persistent session storage (Redis/SQLite)
- LLM-enhanced question phrasing while keeping deterministic strategy
- Real-time streaming responses
- Admin view for interview replay

## License

Hackathon project — ABTalks Vibe Code 2026
