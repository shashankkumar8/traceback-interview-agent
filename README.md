# TRACEBACK

**The interviewer that doesn't just hear your answer. It investigates your understanding.**

## What TRACEBACK Does

TRACEBACK is a polished hackathon-ready AI technical interview platform built for recruiters and interviewers who want evidence-driven candidate assessment.

It is designed to:

- guide interviewer-led candidate selection and interview briefing
- adapt to candidate answers with follow-up, cross-check, and deeper questions
- analyze technical claims for evidence, metrics, tradeoffs, and ownership
- generate a final evaluation summary with strengths, gaps, and next steps
- clearly label offline demo/mock mode and preserve stable behavior

---

## Why It’s Different

TRACEBACK is not a generic chatbot.
It is an investigative technical interviewer that:

- probes superficial claims
- checks whether the candidate owns the implementation
- focuses on production readiness and failure modes
- avoids unrelated or repetitive follow-up
- uses evidence first, then asks deeper questions

---

## Architecture

```text
Frontend (React/Vite)
  ├── Candidate select
  ├── Interview brief
  ├── Adaptive interview workspace
  └── Final feedback report

Backend (FastAPI/Pydantic)
  ├── /api/candidates
  ├── /api/interview
  ├── InterviewEngine
  │     ├── question strategy
  │     ├── evidence extraction
  │     ├── answer analysis
  │     ├── follow-up decisions
  │     └── feedback generation
  └── LLM provider abstraction
```

### Core Modules

| Module                                       | Responsibility                                                       |
| -------------------------------------------- | -------------------------------------------------------------------- |
| `backend/app/main.py`                        | App entrypoint, CORS, candidate and curriculum routes                |
| `backend/app/api/interview.py`               | Interview route validation and request handling                      |
| `backend/app/interview/engine.py`            | Interview flow state machine, topic progression, follow-up decisions |
| `backend/app/interview/question_strategy.py` | Question sequencing, claim probes, topic selection                   |
| `backend/app/interview/evidence.py`          | Evidence extraction, depth classification, answer quality            |
| `backend/app/interview/evaluator.py`         | Final evaluation summary and feedback generation                     |
| `backend/app/llm/provider.py`                | Mock and OpenAI-compatible provider abstraction                      |
| `backend/app/services/candidate_profile.py`  | Candidate context and curriculum signal analysis                     |
| `backend/app/services/curriculum.py`         | Organizer curriculum loading and topic metadata                      |
| `backend/app/storage/session_store.py`       | In-memory session persistence                                        |
| `frontend/src/App.jsx`                       | Root UI state management and backend integration                     |
| `frontend/src/components/`                   | Candidate selection, briefing, interview workspace, feedback screens |

---

## Features

- Candidate-aware interview sessions
- Adaptive follow-up questioning
- Evidence-driven answer analysis
- Cross-check and deeper question flow
- Final feedback with strengths, gaps, and next steps
- Offline mock/demo mode clearly labeled
- Optional OpenAI-compatible LLM provider support

---

## API Summary

### `POST /api/interview`

Starts or continues an interview session.

#### Start request

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
    "missions": [],
    "signals": {}
  }
}
```

#### Continue request

```json
{
  "sessionId": "abc-123",
  "message": "Your answer text here."
}
```

#### Typical response

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

#### Completion response

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
  "progress": {
    "stage": "COMPLETED"
  }
}
```

### `GET /api/candidates`

Returns candidate profiles used by the frontend.

### `GET /api/curriculum`

Returns the curriculum data loaded from the organizer files.

### `GET /health`

Returns backend health.

---

## Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate  # Windows
# or source .venv/bin/activate  # macOS / Linux
pip install -r requirements.txt
```

Create the environment file:

```bash
copy ..\\.env.example ..\\.env  # Windows
cp ../.env.example ../.env      # macOS / Linux
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` for the dev UI.

---

## Production Build

```bash
cd frontend
npm install
npm run build
cd ../backend
uvicorn app.main:app --port 8000
```

---

## Environment Variables

| Variable             | Default       | Description                                         |
| -------------------- | ------------- | --------------------------------------------------- |
| `LLM_PROVIDER`       | `mock`        | LLM provider: `mock`, `openai`, `groq`, or `ollama` |
| `LLM_MODEL`          | `gpt-4o-mini` | Model name used by the selected provider            |
| `LLM_API_KEY`        | —             | API key for the selected provider                   |
| `LLM_BASE_URL`       | —             | Optional OpenAI-compatible API base URL             |
| `MOCK_LLM`           | `true`        | Force mock mode regardless of API key config        |
| `TARGET_QUESTIONS`   | `10`          | Maximum interview question count                    |
| `MAX_MESSAGE_LENGTH` | `4000`        | Maximum candidate answer length                     |

---

## Mock / Demo Mode

Mock mode is the default behavior when a realtime LLM provider is not configured.

It is clearly labelled in the UI as `OFFLINE DEMO MODE`.

This makes the app stable for demonstrations without requiring a paid LLM API.

---

## Real LLM Mode

Configure a real provider:

```text
LLM_PROVIDER=openai
LLM_MODEL=<model-name>
LLM_API_KEY=<your-api-key>
```

If you have a custom OpenAI-compatible endpoint, set `LLM_BASE_URL`.

---

## Testing

```bash
cd backend
pytest -v
```

---

## Demo Flow

1. Open TRACEBACK.
2. Select a candidate.
3. Review the interview brief.
4. Start the interview.
5. Answer a technical question.
6. See evidence analysis and follow-up probing.
7. Answer more deeply.
8. Continue until completion.
9. Review strengths, gaps, and next steps.

---

## Limitations

- Session state is stored in memory.
- Sessions reset when the backend restarts.
- Mock/demo mode is deterministic for demo reliability.
- There is no authentication.
- There is no persistent database.
- Production-grade monitoring and infrastructure are out of scope.
