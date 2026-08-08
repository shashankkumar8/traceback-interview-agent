# TRACEBACK

**The interviewer that doesn't just hear your answer. It investigates your understanding.**

**ABTalks Vibe Code Hackathon — Problem Statement 2: The Interview Agent**

---

## Project

TRACEBACK is a prototype AI interview agent built to evaluate whether a candidate understands their answer, not just whether they mention keywords.

This implementation uses a React frontend and a FastAPI backend to:

- Start or continue interview sessions
- Analyze candidate answers for evidence and answer depth
- Issue follow-up probes on surface-level responses
- Return a final evaluation summary with strengths, gaps, and next steps

---

## Key Capabilities

The repository currently supports:

- Candidate-aware interviewing using organizer-provided candidate profiles
- Curriculum-aware question sequencing based on mission history and module data
- Answer evidence extraction with rule-based analysis and optional LLM support
- Follow-up probing for shallow responses
- Interview session progression tracking and completion logic
- In-memory session storage for prototype state
- Mock LLM mode for reliable development and demo behavior
- Optional OpenAI-compatible LLM provider support through environment configuration

---

## Architecture

```text
Candidate
   |
   v
React Frontend
   |
   v
FastAPI Backend
   |
   v
Interview Engine
   |-- Question Strategy
   |-- Evidence Extraction
   |-- Evaluator
   |-- Candidate Profile
   |-- Curriculum Loader
   `-- LLM Provider
   |
   v
Interview Response
```

### Core Modules

| Module                                       | Responsibility                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| `backend/app/main.py`                        | FastAPI application entrypoint and frontend/static mounting               |
| `backend/app/api/interview.py`               | Interview route validation and request handling                           |
| `backend/app/interview/engine.py`            | Interview state machine and turn-by-turn logic                            |
| `backend/app/interview/question_strategy.py` | Question selection and follow-up guidance                                 |
| `backend/app/interview/evidence.py`          | Answer analysis and evidence classification                               |
| `backend/app/interview/evaluator.py`         | Final feedback generation                                                 |
| `backend/app/llm/provider.py`                | Mock and OpenAI-compatible provider abstraction                           |
| `backend/app/services/candidate_profile.py`  | Candidate context extraction                                              |
| `backend/app/services/curriculum.py`         | Organizer curriculum and candidate data loading                           |
| `backend/app/storage/session_store.py`       | In-memory session persistence                                             |
| `frontend/src/App.jsx`                       | Root UI state machine and backend integration                             |
| `frontend/src/components/`                   | Candidate selection, interview brief, layout, visualizer, and feedback UI |

---

## Repository Layout

```text
TRACEBACK/
|
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |   `-- interview.py
|   |   |
|   |   |-- interview/
|   |   |   |-- engine.py
|   |   |   |-- evaluator.py
|   |   |   |-- evidence.py
|   |   |   `-- question_strategy.py
|   |   |
|   |   |-- llm/
|   |   |   `-- provider.py
|   |   |
|   |   |-- models/
|   |   |   `-- schemas.py
|   |   |
|   |   |-- services/
|   |   |   |-- candidate_profile.py
|   |   |   `-- curriculum.py
|   |   |
|   |   |-- storage/
|   |   |   `-- session_store.py
|   |   |
|   |   |-- config.py
|   |   `-- main.py
|   |
|   |-- tests/
|   |   |-- test_evidence.py
|   |   `-- test_interview_api.py
|   |
|   |-- pytest.ini
|   `-- requirements.txt
|
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- App.jsx
|   |   |-- index.css
|   |   `-- main.jsx
|   |
|   |-- index.html
|   |-- package.json
|   |-- package-lock.json
|   `-- vite.config.js
|
|-- organizer/
|   |-- technical-spec.md
|   |-- curriculum (1).json
|   `-- candidates.json
|
|-- .env.example
|-- .gitignore
|-- PROMPTS.md
`-- README.md
```

> The `organizer/` directory contains organizer-provided resources used to implement the hackathon requirements.

---

## Organizer Contract

The organizer-provided files define the expected behavior for this project:

- `organizer/technical-spec.md` — API contract and interview requirements
- `organizer/curriculum (1).json` — Curriculum topics and day mapping
- `organizer/candidates.json` — Candidate profiles and mission history

The implementation is designed around the organizer contract for interview session start, continuation, candidate context, and completion.

---

## API Endpoints

### `POST /api/interview`

Starts or continues an interview session.

### Start Request

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

### Continue Request

```json
{
  "sessionId": "abc-123",
  "message": "Your answer text here."
}
```

### Typical Response

```json
{
  "reply": "Follow-up question text",
  "done": false,
  "progress": {
    "questionNumber": 3,
    "totalQuestions": 10,
    "stage": "FOLLOW_UP",
    "areasExplored": [
      {
        "name": "Fundamentals",
        "explored": true
      },
      {
        "name": "Implementation",
        "explored": true
      }
    ]
  }
}
```

### Completion Response

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

---

## Additional API Endpoints

### `GET /api/candidates`

Returns candidate profiles used by the frontend.

### `GET /api/curriculum`

Returns curriculum data loaded from the organizer files.

### `GET /health`

Returns the backend health status.

---

## Opening the Project

From the repository root, you can open the project in Visual Studio Code if it is installed:

```bash
code .
```

Then use the editor terminal to run the backend and frontend.

If you want to open the app directly after setup, use one of these URLs:

- Backend-served production preview: `http://localhost:8000`
- Frontend dev server: `http://localhost:5173`

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm

### Backend

```bash
cd backend
python -m venv .venv
```

#### Windows

```bash
.venv\Scripts\activate
```

#### macOS / Linux

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create the environment file.

#### Windows

```bash
copy ..\.env.example ..\.env
```

#### macOS / Linux

```bash
cp ../.env.example ../.env
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

---

## Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

---

## Production Build

Build the frontend:

```bash
cd frontend
npm install
npm run build
```

Then start the backend:

```bash
cd ../backend
uvicorn app.main:app --port 8000
```

Open:

```text
http://localhost:8000
```

---

## Environment Variables

| Variable             | Default       | Description                                          |
| -------------------- | ------------- | ---------------------------------------------------- |
| `LLM_PROVIDER`       | `mock`        | LLM provider: `mock`, `openai`, `groq`, or `ollama`  |
| `LLM_MODEL`          | `gpt-4o-mini` | Model name used by the selected provider             |
| `LLM_API_KEY`        | —             | API key for the selected provider                    |
| `LLM_BASE_URL`       | —             | Optional OpenAI-compatible API base URL              |
| `MOCK_LLM`           | `true`        | Forces mock mode regardless of API key configuration |
| `TARGET_QUESTIONS`   | `10`          | Maximum interview question count                     |
| `MAX_MESSAGE_LENGTH` | `4000`        | Maximum candidate answer length                      |

---

## Mock LLM Mode

Mock mode is enabled by default.

It is used when:

- `MOCK_LLM=true`
- `LLM_PROVIDER=mock`
- No `LLM_API_KEY` is configured

In mock mode, the backend uses `MockLLMProvider` and produces deterministic template-based follow-up questions and feedback.

This makes TRACEBACK suitable for development and hackathon demonstrations without requiring a paid LLM API.

---

## Real LLM Mode

TRACEBACK supports an OpenAI-compatible provider abstraction.

Configure:

```text
LLM_PROVIDER=openai
LLM_MODEL=<model-name>
LLM_API_KEY=<your-api-key>
```

For compatible providers or custom endpoints, `LLM_BASE_URL` can also be configured.

API keys should be stored in environment variables and must never be committed to Git.

---

## Testing

Run the backend test suite:

```bash
cd backend
pytest -v
```

The current tests cover areas including:

- Interview flow
- Session handling
- API response structure
- Evidence extraction
- Answer-depth classification

---

## Demo Flow

For a hackathon judge demonstration:

1. Open TRACEBACK.
2. Select a candidate.
3. Review the interview brief.
4. Begin the assessment.
5. Answer an initial technical question.
6. Show how TRACEBACK analyzes the answer.
7. Demonstrate the follow-up probe.
8. Provide a deeper answer.
9. Continue until the interview completes.
10. Show the final evaluation containing strengths, gaps, and recommended next steps.

### Investigation Loop

```text
Candidate Answer
       |
       v
Evidence Detection
       |
       v
Depth Assessment
       |
       v
Does the answer demonstrate understanding?
       |
       +---- NO ----> Follow-up Probe
       |                    |
       |                    v
       |             Candidate Explains More
       |                    |
       +--------------------+
       |
       v
Continue Assessment
```

---

## Design Principle

TRACEBACK is intentionally different from a keyword-based interview chatbot.

The core interaction model is:

**Answer → Investigate → Verify Understanding → Continue**

Instead of simply asking another unrelated question, TRACEBACK uses the candidate's previous answer to determine:

- What evidence is present
- What evidence is missing
- Whether the explanation demonstrates understanding
- What targeted follow-up should be asked next

This investigation loop is the central product concept demonstrated by the prototype.

---

## Limitations

This is a hackathon prototype rather than a production deployment.

Current limitations include:

- Session state is stored in memory.
- Sessions reset when the backend restarts.
- Mock mode is designed for deterministic development/demo behavior.
- Real LLM quality depends on provider configuration and model behavior.
- There is currently no authentication.
- There is currently no persistent database.
- Production-scale observability and infrastructure are outside the scope of this prototype.

---

## Hackathon Authenticity

TRACEBACK was developed incrementally during the ABTalks Vibe Code Hackathon.

The repository contains:

- Organizer-provided resources
- Application source code
- Tests
- Development prompts
- Configuration examples
- Documentation

`PROMPTS.md` records the AI-assisted development prompts and important implementation interactions used during development.

The project is intended to remain transparent and reproducible rather than presenting fabricated development history.

---

## Project Status

**Status:** Hackathon Prototype

**Problem Statement:** Problem Statement 2 — The Interview Agent

**Project:** TRACEBACK

**Focus:** Evidence-driven technical interviewing and adaptive follow-up questioning.

---

## License

Hackathon project — ABTalks Vibe Code 2026
