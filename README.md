# TRACEBACK

**The interviewer that doesn't just hear your answer. It investigates your understanding.**

ABTalks Vibe Code Hackathon — Problem Statement 2: The Interview Agent

---

## Project

TRACEBACK is a prototype AI interview agent built to evaluate whether a candidate understands their answer, not just whether they mention keywords.

This implementation uses a React frontend and a FastAPI backend to:

- start or continue interview sessions
- analyze candidate answers for evidence and answer depth
- issue follow-up probes on surface-level responses
- return a final evaluation summary with strengths, gaps, and next steps

---

## Key Capabilities

The repository currently supports:

- candidate-aware interviewing using organizer-provided candidate profiles
- curriculum-aware question sequencing based on mission history and module data
- answer evidence extraction with rule-based analysis and optional LLM support
- follow-up probing for shallow responses
- interview session progression tracking and completion logic
- in-memory session storage for prototype state
- mock LLM mode for reliable development/demo behavior
- optional OpenAI-compatible LLM provider support via environment configuration

---

## Architecture

Candidate
↓
Frontend React App
↓
Backend FastAPI API
↓
Interview Engine
├── Question Strategy
├── Evidence Extraction
├── Evaluator
├── Candidate Profile
├── Curriculum Loader
└── LLM Provider
↓
Interview Response

### Core modules

- `backend/app/main.py` — FastAPI app entrypoint and frontend/static mounting
- `backend/app/api/interview.py` — interview route validation and request handling
- `backend/app/interview/engine.py` — interview state machine and turn-by-turn logic
- `backend/app/interview/question_strategy.py` — question selection and follow-up guidance
- `backend/app/interview/evidence.py` — answer analysis and evidence classification
- `backend/app/interview/evaluator.py` — final feedback generation
- `backend/app/llm/provider.py` — mock and OpenAI-compatible provider abstraction
- `backend/app/services/candidate_profile.py` — candidate context extraction
- `backend/app/services/curriculum.py` — organizer curriculum and candidate data loading
- `backend/app/storage/session_store.py` — in-memory session persistence
- `frontend/src/App.jsx` — root UI state machine and backend integration
- `frontend/src/components/` — candidate selection, interview brief, layout, visualizer, feedback

---

## Repository Layout

TRACEBACK/
├── backend/
│ ├── app/
│ │ ├── api/
│ │ ├── interview/
│ │ ├── llm/
│ │ ├── models/
│ │ ├── services/
│ │ └── storage/
│ ├── requirements.txt
│ └── pytest.ini
├── frontend/
│ ├── package.json
│ ├── vite.config.js
│ └── src/
├── organizer/
│ ├── technical-spec.md
│ ├── curriculum (1).json
│ └── candidates.json
├── README.md
├── PROMPTS.md
├── .env.example
└── .gitignore

---

## Organizer Contract

The organizer files define the expected behavior for this project:

- `organizer/technical-spec.md` — API contract and interview requirements
- `organizer/curriculum (1).json` — curriculum topics and day mapping
- `organizer/candidates.json` — candidate profiles and mission history

The current implementation is aligned with the organizer contract for interview session start, continuation, and completion.

---

## API Endpoints

### `POST /api/interview`

Start or continue an interview session.

Start request body:

```json
{
  "sessionId": "abc-123",
  "candidate": {
    "member": {
      "id": "CAND-001",
      "name": "Sarah Johnson",
      "jobRole": "Senior Data Engineer",
      "yearsExperience": 9,
      "education": "MS Computer Science",
      "status": "COMPLETED"
    },
    "missions": [ ... ],
    "signals": { ... }
  }
}
```

Continue request body:

```json
{
  "sessionId": "abc-123",
  "message": "Your answer text here."
}
```

Typical response:

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
      { "name": "Implementation", "explored": true }
    ]
  }
}
```

Completion response:

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
  "progress": { "stage": "COMPLETED" }
}
```

### `GET /api/candidates`

Returns candidate profiles used by the frontend.

### `GET /api/curriculum`

Returns curriculum data from the organizer files.

### `GET /health`

Health check endpoint.

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
copy ..\.env.example ..\.env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Production Build

```bash
cd frontend
npm install
npm run build
cd ../backend
uvicorn app.main:app --port 8000
```

Open `http://localhost:8000` after building the frontend.

---

## Environment Variables

| Variable             | Default       | Description                             |
| -------------------- | ------------- | --------------------------------------- |
| `LLM_PROVIDER`       | `mock`        | `mock`, `openai`, `groq`, `ollama`      |
| `LLM_MODEL`          | `gpt-4o-mini` | Model name for the provider             |
| `LLM_API_KEY`        | —             | API key for OpenAI-compatible providers |
| `LLM_BASE_URL`       | —             | Custom OpenAI-compatible base URL       |
| `MOCK_LLM`           | `true`        | Force mock mode regardless of API key   |
| `TARGET_QUESTIONS`   | `10`          | Interview question limit                |
| `MAX_MESSAGE_LENGTH` | `4000`        | Maximum answer length in characters     |

---

## Mock Mode

Mock mode is enabled by default and is used when:

- `MOCK_LLM=true`
- `LLM_PROVIDER=mock`
- no `LLM_API_KEY` is configured

In mock mode, the backend uses `MockLLMProvider` and returns simple template-based follow-ups and feedback.

---

## Real LLM Mode

Real LLM mode is available when a valid OpenAI-compatible provider is configured.

Required variables:

- `LLM_PROVIDER` set to `openai`, `groq`, or `ollama`
- `LLM_API_KEY`
- optional `LLM_BASE_URL`

`backend/app/llm/provider.py` handles the provider selection and request format.

---

## Testing

Run backend tests:

```bash
cd backend
pytest -v
```

The test suite covers interview flow, session handling, response shape, and evidence/depth classification behavior.

---

## Demo Guidance

For a hackathon judge demo:

1. Open the app and select a candidate.
2. Generate the interview brief.
3. Begin the assessment.
4. Answer a technical question clearly.
5. Show the TRACEBACK pipeline and follow-up question.
6. Answer again with more detail.
7. Complete the interview and show the feedback screen.

If the backend is unavailable, the frontend falls back to a clearly labelled offline demo mode.

---

## Limitations

- Session state is stored in memory and resets when the backend restarts.
- Mock mode is intended for development/demo reliability and not production-grade evaluation.
- Real LLM quality depends on provider configuration and API availability.
- There is no authentication or persistent database in the current implementation.

---

## License

Hackathon project — ABTalks Vibe Code 2026
