/**
 * App.jsx — TRACEBACK Interview Agent
 * Root state machine. Wires CandidateSelect → InterviewBrief → InterviewLayout → FeedbackScreen.
 *
 * API contract is unchanged:
 *   POST /api/interview  { sessionId, candidate }  → start
 *   POST /api/interview  { sessionId, message }    → continue
 *   GET  /api/candidates                           → candidate list
 *
 * Demo/mock mode activates automatically when the backend is unreachable.
 * It is clearly labelled and does not fake real interview results.
 */

import { useCallback, useEffect, useReducer, useRef } from 'react'
import CandidateSelect from './components/CandidateSelect'
import InterviewBrief  from './components/InterviewBrief'
import InterviewLayout from './components/InterviewLayout'
import FeedbackScreen  from './components/FeedbackScreen'
import './index.css'

const API = '/api'

// ─── Helpers ────────────────────────────────────────────────────────────────

function uuid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// ─── Demo fallback data ──────────────────────────────────────────────────────
// Activated ONLY when the backend is unreachable.
// Clearly labelled; does not fake real scoring or evaluation.

const DEMO_CANDIDATES = [
  {
    member: {
      id: 'DEMO-01', name: 'Emily Chen',
      jobRole: 'AI Engineer', yearsExperience: 6,
      education: 'MS Artificial Intelligence', status: 'COMPLETED',
    },
    missions: [
      { day: 7,  title: 'Embeddings Explained',            passed: true,  attempts: 1 },
      { day: 8,  title: 'Vector Databases Overview',        passed: true,  attempts: 2 },
      { day: 10, title: 'Retrieval & Matching Engine',      passed: true,  attempts: 1 },
      { day: 12, title: 'Prompt Engineering Fundamentals',  passed: true,  attempts: 1 },
      { day: 21, title: 'LangChain Agents',                 passed: true,  attempts: 1 },
      { day: 23, title: 'Model Context Protocol (MCP)',     skipped: true, attempts: 1 },
      { day: 31, title: 'Capstone Project & Final Demo',    passed: true,  attempts: 1 },
    ],
    signals: { commitDays: 31, missionsCompleted: 28, missionsFirstTry: 25 },
  },
  {
    member: {
      id: 'DEMO-02', name: 'Marcus Vance',
      jobRole: 'Backend Software Engineer', yearsExperience: 10,
      education: 'BS Computer Science', status: 'COMPLETED',
    },
    missions: [
      { day: 3,  title: 'React Frontend Setup',            passed: true,  attempts: 1 },
      { day: 10, title: 'Retrieval & Matching Engine',     passed: true,  attempts: 4 },
      { day: 12, title: 'Prompt Engineering Fundamentals', passed: false, attempts: 4 },
      { day: 28, title: 'Docker & Kubernetes Deployment',  passed: true,  attempts: 2 },
    ],
    signals: { commitDays: 20, missionsCompleted: 15, missionsFirstTry: 8 },
  },
]

// Scripted demo turn pairs: [question, followUpQuestion]
const DEMO_SCRIPT = {
  'DEMO-01': {
    questions: [
      `Welcome, Emily. I'm TRACEBACK — I'll explore your understanding of the AI engineering curriculum, tailored to your background as an AI Engineer.\n\nWalk me through how you would build a retrieval pipeline end to end — from raw documents to a ranked answer. What are the critical decisions at each stage?`,
      `You mentioned chunking strategy. What specific chunk size and overlap did you use, and how did you measure whether that was the right choice?`,
      `Solid. Let's shift to agents — you completed the LangChain Agents module. What is the difference between a ReAct agent and a simple chain, and when would you choose one over the other?`,
    ],
    feedback: {
      summary: 'Emily demonstrated strong working knowledge of RAG pipeline construction and embedding fundamentals. Her answers showed hands-on implementation experience, though production-level evaluation practices could be deepened. Overall a technically credible AI Engineering candidate.',
      strengths: [
        'Clear end-to-end understanding of retrieval pipeline stages',
        'Solid grasp of vector similarity and embedding model selection tradeoffs',
        'Confident explanation of LangChain agent loop mechanics',
      ],
      gaps: [
        'Chunking parameter justification lacked quantitative evaluation evidence',
        'Did not articulate specific latency or recall@k targets for production readiness',
        'MCP module was skipped — limited visibility into tool-use orchestration patterns',
      ],
      next: [
        'Implement chunk overlap A/B testing with recall@k metrics',
        'Study production observability: tracing, latency budgets, failure logging',
        'Complete the MCP module to close the tool-execution knowledge gap',
        'Practice explaining RAG failure modes and mitigation strategies',
      ],
    },
  },
  'DEMO-02': {
    questions: [
      `Welcome, Marcus. I'm TRACEBACK — I'll explore your understanding of the AI engineering curriculum, tailored to your background as a Backend Software Engineer.\n\nYou struggled with Prompt Engineering Fundamentals, requiring four attempts. Walk me through what finally clicked — what was your original mental model versus what the module revealed?`,
      `Interesting. When integrating an LLM API into a FastAPI service, what are the top three failure modes you'd plan for, and how would you handle them in production?`,
      `You mentioned rate limiting as a failure mode. What specific strategy — token buckets, exponential backoff, or queuing — would you implement, and why?`,
    ],
    feedback: {
      summary: 'Marcus brings strong backend infrastructure instincts to AI engineering, with a pragmatic focus on reliability and deployment. His prompt engineering fundamentals showed significant improvement after initial friction. System-level thinking is a clear strength; LLM-specific evaluation practices are an area for growth.',
      strengths: [
        'Strong production reliability thinking — failure modes, retries, circuit breakers',
        'Clear understanding of containerization and Kubernetes deployment patterns',
        'Pragmatic approach to debugging — evidence of persistence through difficult modules',
      ],
      gaps: [
        'Initial prompt engineering mental model was procedural rather than probabilistic',
        'Limited articulation of LLM-specific evaluation metrics (BLEU, semantic similarity)',
        'Retrieval and matching engine required multiple attempts — vector search concepts need reinforcement',
      ],
      next: [
        'Study probabilistic prompting patterns and structured output contracts',
        'Implement a retrieval evaluation harness with recall@k and MRR metrics',
        'Explore LLM observability tools: LangSmith, Helicone, or OpenTelemetry tracing',
      ],
    },
  },
}

function getDemoScript(candidateId) {
  return DEMO_SCRIPT[candidateId] || DEMO_SCRIPT['DEMO-01']
}

// ─── State shape ─────────────────────────────────────────────────────────────

const SCREENS = { SELECT: 'SELECT', BRIEF: 'BRIEF', INTERVIEW: 'INTERVIEW', FEEDBACK: 'FEEDBACK' }

function initialState() {
  return {
    screen: SCREENS.SELECT,
    sessionId: uuid(),
    candidates: [],
    selectedId: '',
    history: [],            // [{ role: 'interviewer'|'candidate', text }]
    currentQuestion: '',
    answer: '',
    progress: null,
    feedback: null,
    loading: false,
    loadingStep: '',
    error: '',
    demoMode: false,
    demoTurn: 0,            // which scripted question we're on (demo only)
  }
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CANDIDATES':
      return { ...state, candidates: action.payload, selectedId: action.payload[0]?.member?.id || '', loading: false, loadingStep: '' }
    case 'SET_DEMO_MODE':
      return { ...state, demoMode: true, candidates: DEMO_CANDIDATES, selectedId: DEMO_CANDIDATES[0].member.id, loading: false, loadingStep: '' }
    case 'SELECT_CANDIDATE':
      return { ...state, selectedId: action.payload }
    case 'SHOW_BRIEF':
      return { ...state, screen: SCREENS.BRIEF, error: '' }
    case 'BACK_TO_SELECT':
      return { ...state, screen: SCREENS.SELECT, error: '' }
    case 'LOADING_START':
      return { ...state, loading: true, loadingStep: action.step || '', error: '' }
    case 'LOADING_STEP':
      return { ...state, loadingStep: action.step }
    case 'LOADING_END':
      return { ...state, loading: false, loadingStep: '' }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false, loadingStep: '',
               // Restore answer so the user can retry without retyping
               answer: action.lastAnswer ?? state.answer }
    case 'CLEAR_ERROR':
      return { ...state, error: '' }
    case 'INTERVIEW_STARTED':
      return {
        ...state,
        screen: SCREENS.INTERVIEW,
        currentQuestion: action.question,
        progress: action.progress,
        loading: false,
        loadingStep: '',
        history: [],
        answer: '',
        demoTurn: 1,
      }
    case 'ANSWER_SUBMITTED':
      return {
        ...state,
        history: [
          ...state.history,
          { role: 'interviewer', text: state.currentQuestion },
          { role: 'candidate',   text: action.userAnswer },
        ],
        answer: '',
        currentQuestion: '',
      }
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestion: action.question,
        progress: action.progress ?? state.progress,
        loading: false,
        loadingStep: '',
        demoTurn: state.demoTurn + 1,
      }
    case 'INTERVIEW_COMPLETE':
      return {
        ...state,
        screen: SCREENS.FEEDBACK,
        feedback: action.feedback,
        progress: action.progress ?? state.progress,
        loading: false,
        loadingStep: '',
        currentQuestion: '',
      }
    case 'SET_ANSWER':
      return { ...state, answer: action.payload }
    case 'RESTART':
      return { ...initialState(), candidates: state.candidates, demoMode: state.demoMode,
               selectedId: state.candidates[0]?.member?.id || '' }
    default:
      return state
  }
}

// ─── Loading step rotator ─────────────────────────────────────────────────────

const ANALYSIS_STEPS = [
  'Analyzing reasoning metrics...',
  'Mapping technologies vs claims...',
  'Identifying knowledge gaps...',
  'Formulating adaptive follow-up...',
]

function useStepRotator(dispatch) {
  const ref = useRef(null)
  const start = useCallback(() => {
    let i = 0
    ref.current = setInterval(() => {
      if (i < ANALYSIS_STEPS.length) {
        dispatch({ type: 'LOADING_STEP', step: ANALYSIS_STEPS[i] })
        i++
      }
    }, 650)
  }, [dispatch])
  const stop = useCallback(() => {
    clearInterval(ref.current)
  }, [])
  return { start, stop }
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const rotator = useStepRotator(dispatch)

  const selected = state.candidates.find((c) => c.member?.id === state.selectedId)

  // ── Boot: fetch candidates ────────────────────────────────────────────────
  useEffect(() => {
    dispatch({ type: 'LOADING_START', step: 'Loading candidates...' })
    fetch(`${API}/candidates`)
      .then((r) => {
        if (!r.ok) throw new Error('Backend offline')
        return r.json()
      })
      .then((data) => {
        const list = data.candidates || []
        if (list.length === 0) throw new Error('No candidates returned')
        dispatch({ type: 'SET_CANDIDATES', payload: list })
      })
      .catch(() => {
        dispatch({ type: 'SET_DEMO_MODE' })
      })
  }, [])

  // ── Start interview ───────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (!selected) return
    dispatch({ type: 'LOADING_START', step: 'Preparing interview...' })

    if (state.demoMode) {
      // Demo fallback: simulate engine startup
      await new Promise((r) => setTimeout(r, 1100))
      const script = getDemoScript(selected.member.id)
      dispatch({
        type: 'INTERVIEW_STARTED',
        question: script.questions[0],
        progress: {
          questionNumber: 1,
          totalQuestions: script.questions.length,
          stage: 'QUESTIONING',
          areasExplored: [
            { name: 'Fundamentals',   explored: true  },
            { name: 'Implementation', explored: false },
            { name: 'Tradeoffs',      explored: false },
            { name: 'Debugging',      explored: false },
            { name: 'Production',     explored: false },
            { name: 'Security',       explored: false },
            { name: 'Evaluation',     explored: false },
            { name: 'System Design',  explored: false },
          ],
        },
      })
      return
    }

    try {
      const res = await fetch(`${API}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId, candidate: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to start interview')
      dispatch({ type: 'INTERVIEW_STARTED', question: data.reply, progress: data.progress })
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message || 'Failed to start interview. Please retry.' })
    }
  }, [selected, state.demoMode, state.sessionId])

  // ── Submit answer ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const userAnswer = state.answer.trim()
    if (!userAnswer || state.loading) return

    dispatch({ type: 'ANSWER_SUBMITTED', userAnswer })
    dispatch({ type: 'LOADING_START', step: 'Analyzing reasoning metrics...' })
    rotator.start()

    if (state.demoMode) {
      await new Promise((r) => setTimeout(r, 2400))
      rotator.stop()
      const script   = getDemoScript(selected?.member?.id)
      const nextTurn = state.demoTurn          // demoTurn was set to 1 on start; counts submitted answers
      const nextQ    = script.questions[nextTurn]

      if (nextQ) {
        const prevExplored = state.progress?.areasExplored || []
        const dimOrder = ['Fundamentals','Implementation','Tradeoffs','Debugging','Production','Security','Evaluation','System Design']
        const newAreas = dimOrder.map((name, i) => ({
          name,
          explored: i < nextTurn + 1 || (prevExplored[i]?.explored ?? false),
        }))
        dispatch({
          type: 'NEXT_QUESTION',
          question: nextQ,
          progress: {
            questionNumber: nextTurn + 1,
            totalQuestions: script.questions.length,
            stage: nextTurn >= 1 ? 'FOLLOW_UP' : 'QUESTIONING',
            areasExplored: newAreas,
          },
        })
      } else {
        // All scripted questions exhausted → complete
        const finalAreas = (state.progress?.areasExplored || []).map((a) => ({ ...a, explored: true }))
        dispatch({
          type: 'INTERVIEW_COMPLETE',
          feedback: script.feedback,
          progress: {
            ...(state.progress || {}),
            questionNumber: script.questions.length,
            stage: 'COMPLETED',
            areasExplored: finalAreas,
          },
        })
      }
      return
    }

    // Live API path
    try {
      const res = await fetch(`${API}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId, message: userAnswer }),
      })
      const data = await res.json()
      rotator.stop()
      if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Request failed')
      if (data.done) {
        dispatch({ type: 'INTERVIEW_COMPLETE', feedback: data.feedback, progress: data.progress })
      } else {
        dispatch({ type: 'NEXT_QUESTION', question: data.reply, progress: data.progress })
      }
    } catch (e) {
      rotator.stop()
      dispatch({
        type: 'SET_ERROR',
        payload: e.message || 'Something went wrong. Your answer is preserved — please retry.',
        lastAnswer: userAnswer,
      })
    }
  }, [state.answer, state.loading, state.demoMode, state.sessionId, state.demoTurn, state.progress, selected, rotator])

  // ── Retry (re-submit last answer after error) ─────────────────────────────
  const handleRetry = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
    // The answer textarea is still populated (ANSWER_SUBMITTED cleared it, so
    // we can't auto-re-submit — just clear the error and let the user resend)
  }, [])

  // ── Restart ───────────────────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    dispatch({ type: 'RESTART' })
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  const { screen, demoMode, loading, loadingStep, error } = state

  return (
    <div className="app-shell">
      {/* Top bar */}
      <header className="app-topbar">
        <div>
          <div className="brand-logo">TRACE<span className="cyan-highlight">BACK</span></div>
          <div className="brand-tagline">The interviewer that doesn't just hear your answer. It investigates your understanding.</div>
        </div>
        <div className="topbar-right">
          {demoMode && <span className="demo-badge">OFFLINE DEMO MODE</span>}
          {screen === SCREENS.INTERVIEW && !state.feedback && (
            <div className="status-pill">
              <span className="pulse-dot" />
              INVESTIGATION ACTIVE
            </div>
          )}
        </div>
      </header>

      {/* Global error (only shown outside InterviewLayout which has its own) */}
      {error && screen !== SCREENS.INTERVIEW && (
        <div className="global-error">
          <span className="global-error-icon">⚠</span>
          {error}
        </div>
      )}

      {/* Screen router */}
      {screen === SCREENS.SELECT && (
        <CandidateSelect
          candidates={state.candidates}
          selectedId={state.selectedId}
          onSelect={(id) => dispatch({ type: 'SELECT_CANDIDATE', payload: id })}
          onNext={() => dispatch({ type: 'SHOW_BRIEF' })}
          demoMode={demoMode}
        />
      )}

      {screen === SCREENS.BRIEF && (
        <InterviewBrief
          candidate={selected}
          onStart={handleStart}
          onBack={() => dispatch({ type: 'BACK_TO_SELECT' })}
          loading={loading}
        />
      )}

      {screen === SCREENS.INTERVIEW && (
        <InterviewLayout
          candidate={selected}
          history={state.history}
          currentQuestion={state.currentQuestion}
          answer={state.answer}
          onAnswerChange={(v) => dispatch({ type: 'SET_ANSWER', payload: v })}
          onSubmit={handleSubmit}
          loading={loading}
          loadingStep={loadingStep}
          progress={state.progress}
          error={error}
          onRetry={handleRetry}
          demoMode={demoMode}
        />
      )}

      {screen === SCREENS.FEEDBACK && (
        <FeedbackScreen
          feedback={state.feedback}
          candidate={selected}
          progress={state.progress}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
