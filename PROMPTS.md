# TRACEBACK Prompt History

## Entry 1 — Project Architecture & Full Build

Date: 2026-08-09
Tool: Cursor Agent
Purpose: Initial repository inspection and full TRACEBACK implementation from organizer files

Prompt:

> # TRACEBACK — MASTER BUILD DIRECTIVE
>
> You are the lead engineer, product architect, UI/UX designer, AI engineer, QA engineer, security reviewer, and hackathon judge for this project.
>
> We are building TRACEBACK — The interviewer that doesn't just hear your answer. It investigates your understanding.
>
> [... full master build directive with API contract, interview engine, frontend, tests, README requirements ...]
>
> START NOW — First inspect the repository and all organizer-provided files. Then implement TRACEBACK incrementally.

Result:

- Inspected organizer files: `technical-spec.md`, `curriculum (1).json`, `candidates.json`
- Built FastAPI backend with `POST /api/interview` matching organizer contract
- Implemented interview state machine with evidence extraction and claim investigation
- Added mock LLM mode for development without API keys
- Built React/Vite frontend with progress indicators and feedback UI
- Added pytest coverage for API, sessions, completion, and evidence logic

## Entry 2 — Async LLM Integration & UI Redesign

Date: 2026-08-09
Tool: Antigravity Agent
Purpose: Integrate asynchronous LLM-powered candidate analysis, claims probing, answer analysis, and feedback evaluation with a rule-based fallback, and redesign the frontend to look premium and technical.

Prompt:

> You are the lead engineer and product architect for our ABTalks Vibe Code Hackathon project.
>
> Project name: TRACEBACK
>
> Tagline:
> "The interviewer that doesn't just hear your answer. It investigates your understanding."
>
> [... full prompt containing backend contracts, candidate-aware rules, LLM provider requirements, and styling guidelines ...]

Result:

- Converted `InterviewEngine` and `api/interview` routes to be asynchronous.
- Implemented LLM-powered answer analysis (`extract_evidence`), question strategy generation (`generate_next_question_llm`), and feedback evaluation (`generate_feedback`) using the `LLMProvider` abstraction.
- Built a robust template and rule-based fallback to guarantee system reliability when LLM provider is set to mock or if an LLM call fails.
- Redesigned the entire React UI and CSS styling to deliver a modern, glassmorphic dark-theme developer dashboard showing candidate stats, curriculum maps, evaluated dimensions, and structured feedback cards.
- Verified all system routes and logic using unit tests and compiled the frontend code successfully.

## Entry 3 — Core Interview Intelligence

Date: 2026-08-09
Tool: Antigravity Agent
Purpose: Implement the candidate context engine, internal plan generation, adaptive stage progression, structured answer quality analysis, dynamic follow-up probing, difficulty adaptation, and anti-repetition.

Prompt:

> Now implement the core TRACEBACK interview intelligence.
> Do NOT redesign the entire application.
> Read the existing implementation first and modify it incrementally.
> [... full core intelligence requirements: context mapping, internal planning, progression, structured analyses, difficulty adaptation, safety termination ...]

Result:

- Created candidate context normalization mapping mission history to strengths, weak areas, skips, attempts, and completion metrics in `candidate_profile.py`.
- Implemented `generate_interview_plan` to outline competency goals, difficulty levels, target strengths/weaknesses, and likely follow-up concepts.
- Added structured LLM-based answer analysis (`analyze_answer`) evaluating correctness, depth, misconceptions, missing concepts, and follow-up requirements.
- Integrated progressive complexity/adaptation guidelines in `generate_next_question_llm` based on the candidate's last answer evaluation and history.
- Upgraded the state machine termination logic to check competency dimensions and safety limits, and tested with multiple candidate types.



## Entry 4 — Hackathon Demo UI Overhaul

Date: 2026-08-09
Tool: Kiro Agent
Purpose: Improve TRACEBACK specifically for a live hackathon judging demo — polished product quality, "wow" factor, demo reliability. No architecture changes.

Prompt:

> Now improve TRACEBACK specifically for a live hackathon judging demo.
> Do not replace working architecture.
> Focus on visible product quality and the "wow" factor.
>
> IMPLEMENT:
> 1. Candidate Selection Screen — sortable list with name, role, experience, education, completion bar
> 2. Interview Brief — pre-interview preparation screen with algorithmically derived focus areas
> 3. Interview UI — polished two-column desktop layout, left: profile + intelligence indicators, right: conversation
> 4. TRACEBACK Visualization — Answer → Analysis → Traceback → Follow-Up pipeline with live step highlighting
> 5. Interview States — Preparing / Listening / Analyzing / Tracing / Follow-up / Complete
> 6. Feedback Screen — assessment, strengths, knowledge gaps, next steps, competency coverage chart
> 7. Microinteractions — message animations, typing indicator, progress transitions, button feedback
> 8. Error UX — friendly error, preserve conversation, allow retry, never blank screen
> 9. Responsive behavior — laptop + tablet/mobile usable
> 10. Demo Reliability — mock mode ONLY if needed, clearly labelled, real API must remain functional
>
> Update README and PROMPTS.md. Run the application and inspect for errors.
> Do not modify the API contract.

Result:

**Architecture:** No backend changes. API contract (`POST /api/interview`, `GET /api/candidates`) is unchanged.

**Frontend restructure:**
- `App.jsx` rewritten as a `useReducer` state machine with 4 named screens: `SELECT → BRIEF → INTERVIEW → FEEDBACK`
- Logic split into 5 focused components in `frontend/src/components/`:
  - `CandidateSelect.jsx` — sorted candidate list with role-color avatars, completion bars, mission history detail panel
  - `InterviewBrief.jsx` — interviewer preparation screen with algorithmically tagged focus areas (CORE/GAP/VERIFY/PROBE)
  - `TracebackVisualizer.jsx` — live pipeline step indicator: Answer → Analysis → Traceback → Follow-Up with pulse ring animation and rotating status bar
  - `InterviewLayout.jsx` — two-column layout: left sidebar (profile + visualizer + dimension grid), right chat panel with typing indicator, error inline with Retry, Ctrl+Enter submit
  - `FeedbackScreen.jsx` — assessment, competency coverage chart (8 dimensions with animated fill bar), strengths/gaps columns, next steps grid

**Styling:**
- `index.css` rewritten from scratch: glassmorphic dark theme, DM Sans + JetBrains Mono, role-color system, all microinteractions (slide-in messages, pulse ring, typing dots, progress transitions, button hover lifts), responsive breakpoints at 920px / 640px / 480px

**Demo mode:**
- Auto-activates on backend failure — no manual toggle needed
- Scripted 3-turn interviews per candidate (DEMO-01: Emily Chen, DEMO-02: Marcus Vance)
- Realistic questions and feedback content; clearly labelled "OFFLINE DEMO MODE" in header
- Does not fake or override real evaluation results

**Build:** Clean — 36 modules, 0 errors, 0 warnings. JS: 176 kB gzip 55 kB. CSS: 26 kB gzip 5 kB.
