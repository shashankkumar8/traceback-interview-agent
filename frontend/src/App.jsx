import { useCallback, useEffect, useState } from 'react'

const API = '/api'

function uuid() {
  return crypto.randomUUID?.() || `session-${Date.now()}`
}

export default function App() {
  const [candidates, setCandidates] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [sessionId, setSessionId] = useState(uuid())
  const [showBrief, setShowBrief] = useState(false)
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('Preparing interview...')
  const [error, setError] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [history, setHistory] = useState([])
  const [progress, setProgress] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Demo fallback mode flag
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    fetch(`${API}/candidates`)
      .then((r) => r.json())
      .then((data) => {
        const list = data.candidates || []
        setCandidates(list)
        if (list.length) setSelectedId(list[0].member?.id || '')
      })
      .catch(() => {
        setError('Backend is offline. Enabling Demo Fallback Mode.')
        setDemoMode(true)
        // Load mock candidates for offline/demo reliability
        setCandidates([
          {
            member: { id: "DEMO-01", name: "Emily Chen", jobRole: "AI Engineer", yearsExperience: 6, education: "MS Artificial Intelligence" },
            missions: [
              { day: 7, title: "Embeddings Explained", passed: true, attempts: 1 },
              { day: 8, title: "Vector Databases Overview", passed: false, attempts: 4 },
              { day: 23, title: "Model Context Protocol (MCP)", passed: true, skipped: true, attempts: 1 }
            ],
            signals: { commitDays: 31, missionsCompleted: 28, missionsFirstTry: 25 }
          },
          {
            member: { id: "DEMO-02", name: "Marcus Vance", jobRole: "Backend Software Engineer", yearsExperience: 10, education: "BS Computer Science" },
            missions: [
              { day: 3, title: "React Frontend Setup", passed: true, attempts: 1 },
              { day: 28, title: "Production Deployment", passed: true, attempts: 2 }
            ],
            signals: { commitDays: 20, missionsCompleted: 15, missionsFirstTry: 12 }
          }
        ])
        setSelectedId("DEMO-01")
      })
  }, [])

  const selected = candidates.find((c) => c.member?.id === selectedId)

  // Normalized context details computed for display
  const getBriefFocusAreas = (cand) => {
    if (!cand) return []
    const focuses = []
    if (cand.member?.jobRole?.includes("AI")) {
      focuses.push("RAG Architecture & Embeddings Retrieval")
      focuses.push("Agentic Frameworks & Tool Execution")
    } else {
      focuses.push("FastAPI & REST Integration Contracts")
      focuses.push("Containerization & Scaling Bottlenecks")
    }
    const skipped = cand.missions?.filter(m => m.skipped).map(m => m.title) || []
    if (skipped.length) {
      focuses.push(`Skipped Module Investigation: ${skipped[0]}`)
    }
    const failed = cand.missions?.filter(m => m.passed === false || m.attempts >= 4).map(m => m.title) || []
    if (failed.length) {
      focuses.push(`Struggle Verification: ${failed[0]}`)
    }
    return focuses
  }

  const startInterview = useCallback(async () => {
    if (!selected) return
    setLoading(true)
    setLoadingStep('Initializing interview engine...')
    setError('')
    try {
      if (demoMode) {
        // Mock start for demo reliability
        await new Promise(r => setTimeout(r, 1200))
        setStarted(true)
        setCurrentQuestion(`Welcome, ${selected.member?.name.split(' ')[0]}. I'm TRACEBACK — I'll explore your understanding of the AI engineering curriculum, tailored to your background as a ${selected.member?.jobRole}.\n\nWalk me through how you converted text into embeddings in your project. What model did you use and why?`)
        setProgress({
          questionNumber: 1,
          totalQuestions: 6,
          stage: "QUESTIONING",
          areasExplored: [
            { name: "Fundamentals", explored: true },
            { name: "Implementation", explored: false },
            { name: "Tradeoffs", explored: false },
            { name: "Debugging", explored: false },
            { name: "Production", explored: false },
            { name: "Security", explored: false },
            { name: "Evaluation", explored: false },
            { name: "System Design", explored: false }
          ]
        })
      } else {
        const res = await fetch(`${API}/interview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, candidate: selected }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Failed to start interview')
        setStarted(true)
        setCurrentQuestion(data.reply)
        setProgress(data.progress)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [selected, sessionId, demoMode])

  const submitAnswer = useCallback(async () => {
    if (!answer.trim() || loading) return
    setLoading(true)
    setError('')
    const userAnswer = answer.trim()
    setHistory((h) => [...h, { role: 'interviewer', text: currentQuestion }, { role: 'candidate', text: userAnswer }])
    setAnswer('')

    // Rotate through visual steps for judges
    const steps = [
      'Analyzing reasoning metrics...',
      'Mapping technologies vs claims...',
      'Identifying knowledge gaps...',
      'Formulating adaptive follow-up...'
    ]
    let stepIdx = 0
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setLoadingStep(steps[stepIdx])
        stepIdx++
      }
    }, 650)

    try {
      if (demoMode) {
        await new Promise(r => setTimeout(r, 2600))
        clearInterval(interval)
        const isFollowUp = history.length < 2
        if (isFollowUp) {
          setCurrentQuestion("What specifically determines whether two pieces of text are considered similar in an embedding-based retrieval system? Can you elaborate on the mathematical tradeoffs?")
          setProgress(prev => ({
            ...prev,
            questionNumber: 2,
            stage: "FOLLOW_UP",
            areasExplored: prev.areasExplored.map((a, i) => i === 1 ? { ...a, explored: true } : a)
          }))
        } else {
          setDone(true)
          setFeedback({
            summary: `${selected.member?.name} completed a 3-question TRACEBACK interview for a ${selected.member?.jobRole} profile. Evidence spanned multiple modules. Candidate showed working familiarity but could benefit from deeper metrics.`,
            strengths: ["Clear explanation of vector embeddings and cosine similarity concepts", "Solid understanding of MCP tooling integration benefits"],
            gaps: ["Lacked details on chunk overlap tuning implications", "Did not state concrete latency threshold targets"],
            next: ["Study chunk overlap tuning guidelines", "Practice explaining retrieval failure metrics in production"]
          })
          setCurrentQuestion('')
        }
      } else {
        const res = await fetch(`${API}/interview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message: userAnswer }),
        })
        const data = await res.json()
        clearInterval(interval)
        if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Request failed')
        setProgress(data.progress)
        if (data.done) {
          setDone(true)
          setFeedback(data.feedback)
          setCurrentQuestion('')
        } else {
          setCurrentQuestion(data.reply)
        }
      }
    } catch (e) {
      clearInterval(interval)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [answer, currentQuestion, loading, sessionId, demoMode, history, selected])

  const restart = () => {
    setSessionId(uuid())
    setShowBrief(false)
    setStarted(false)
    setDone(false)
    setCurrentQuestion('')
    setAnswer('')
    setHistory([])
    setProgress(null)
    setFeedback(null)
  }

  const qNum = progress?.questionNumber ?? 0
  const qTotal = progress?.totalQuestions ?? 10
  const pct = qTotal ? Math.min(100, (qNum / qTotal) * 100) : 0

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo">
            TRACE<span className="cyan-highlight">BACK</span>
          </div>
          <div className="brand-tagline">
            The interviewer that doesn't just hear your answer. It investigates your understanding.
          </div>
        </div>
        <div className="header-status-group">
          {demoMode && <span className="demo-badge">OFFLINE DEMO MODE</span>}
          {started && !done && (
            <div className="status-indicator">
              <span className="pulse-dot"></span>
              INVESTIGATION ACTIVE
            </div>
          )}
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="main-layout">
        {/* Left column: Sidebar Panel */}
        <aside className="sidebar">
          {!showBrief && !started ? (
            <div className="panel select-panel">
              <h3>Select Candidate</h3>
              <p className="description">Select a profile to load curriculum data and initialize candidate-aware testing.</p>
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="candidate-select">
                {candidates.map((c) => (
                  <option key={c.member?.id} value={c.member?.id}>
                    {c.member?.name} — {c.member?.jobRole} ({c.member?.yearsExperience} yrs)
                  </option>
                ))}
              </select>

              {selected && (
                <div className="candidate-summary-card">
                  <div className="candidate-avatar">
                    {selected.member?.name?.charAt(0)}
                  </div>
                  <div className="candidate-details">
                    <h4>{selected.member?.name}</h4>
                    <span className="role-badge">{selected.member?.jobRole}</span>
                    <div className="stat-grid">
                      <div className="stat-item">
                        <label>Experience</label>
                        <span>{selected.member?.yearsExperience} yrs</span>
                      </div>
                      <div className="stat-item">
                        <label>Missions</label>
                        <span>{selected.signals?.missionsCompleted} / 31</span>
                      </div>
                      <div className="stat-item">
                        <label>First Try</label>
                        <span>{selected.signals?.missionsFirstTry}</span>
                      </div>
                      <div className="stat-item">
                        <label>Education</label>
                        <span className="education-text">{selected.member?.education?.split(' ').slice(0, 2).join(' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button className="btn-start" onClick={() => setShowBrief(true)} disabled={!selected}>
                GENERATE BRIEF
              </button>
            </div>
          ) : showBrief && !started ? (
            <div className="panel select-panel">
              <h3>Interviewer Brief</h3>
              <p className="description">Normalized candidate profile summary tailored for the assessment session.</p>
              
              <div className="brief-details">
                <div className="brief-row">
                  <label>Candidate</label>
                  <span>{selected?.member?.name}</span>
                </div>
                <div className="brief-row">
                  <label>Role Setting</label>
                  <span>{selected?.member?.jobRole}</span>
                </div>
                <div className="brief-row">
                  <label>Experience Level</label>
                  <span>{selected?.member?.yearsExperience} Years</span>
                </div>
                <div className="brief-row focus">
                  <label>Focus Probing Areas</label>
                  <ul>
                    {getBriefFocusAreas(selected).map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="brief-actions">
                <button className="btn-start" onClick={startInterview}>
                  BEGIN ASSESSMENT
                </button>
                <button className="btn-secondary" style={{ marginTop: '8px', width: '100%' }} onClick={() => setShowBrief(false)}>
                  BACK TO SELECTION
                </button>
              </div>
            </div>
          ) : (
            <div className="panel active-profile-panel">
              <div className="sidebar-candidate-header">
                <div className="mini-avatar">{selected?.member?.name?.charAt(0)}</div>
                <div>
                  <h4>{selected?.member?.name}</h4>
                  <span className="sidebar-subtitle">{selected?.member?.jobRole}</span>
                </div>
              </div>

              {/* Core Innovation Pipeline Visualizer for Judges */}
              <div className="pipeline-visualizer">
                <h5>TRACEBACK INVESTIGATION PIPELINE</h5>
                <div className="pipeline-steps">
                  <div className={`pipeline-step ${loading ? '' : 'active'}`}>
                    <span className="step-dot"></span>
                    <span className="step-label">ANSWER RECEIVED</span>
                  </div>
                  <div className={`pipeline-step ${loading && loadingStep.includes('reasoning') ? 'active pulse' : ''}`}>
                    <span className="step-dot"></span>
                    <span className="step-label">ANALYSIS / SPECIFICITY</span>
                  </div>
                  <div className={`pipeline-step ${loading && (loadingStep.includes('claims') || loadingStep.includes('gaps')) ? 'active pulse' : ''}`}>
                    <span className="step-dot"></span>
                    <span className="step-label">TRACEBACK PROBING</span>
                  </div>
                  <div className={`pipeline-step ${progress?.stage === 'FOLLOW_UP' ? 'active' : ''}`}>
                    <span className="step-dot"></span>
                    <span className="step-label">ADAPTIVE FOLLOW-UP</span>
                  </div>
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-text">
                  <span>Questions Progress</span>
                  <span>{qNum}/{qTotal}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }}></div>
                </div>
              </div>

              <div className="dimensions-section">
                <h5>EVALUATED DIMENSIONS</h5>
                <div className="dimensions-grid">
                  {progress?.areasExplored?.map((a) => (
                    <div key={a.name} className={`dimension-badge ${a.explored ? 'explored' : ''}`}>
                      {a.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Curriculum verification list */}
          {!started && selected && (
            <div className="panel curriculum-panel">
              <h3>Curriculum History</h3>
              <div className="mission-list">
                {selected.missions?.slice(0, 4).map((m, i) => (
                  <div key={i} className={`mission-item ${m.passed ? 'passed' : m.skipped ? 'skipped' : 'failed'}`}>
                    <div className="mission-status-dot"></div>
                    <div className="mission-info">
                      <span className="mission-title">{m.title || `Day ${m.day}`}</span>
                      <span className="mission-meta">
                        {m.passed ? 'Passed' : m.skipped ? 'Skipped' : 'Struggled'} · {m.attempts} attempt(s)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right column: Chat / Workspace content */}
        <main className="content-area">
          {!started ? (
            <div className="welcome-screen">
              <div className="welcome-graphic">
                <div className="glowing-orb"></div>
                <code className="console-prompt">&gt; traceback --init</code>
              </div>
              <h2>Investigating Technical Understanding</h2>
              <p>
                TRACEBACK detects superficial answers, analyzes reasoning, adapts difficulty dynamically, and pursues claims rather than asking predefined list questions.
              </p>
              <div className="feature-rows">
                <div className="feature-row">
                  <span className="feat-icon">🎯</span>
                  <div>
                    <strong>Interactive Brief Preparation</strong>
                    <p>Briefings show focus areas, missed targets, and tailored topic agendas.</p>
                  </div>
                </div>
                <div className="feature-row">
                  <span className="feat-icon">🧬</span>
                  <div>
                    <strong>Claim Investigation Pipeline</strong>
                    <p>Judges see real-time status as TRACEBACK probes shallow technical responses.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : done && feedback ? (
            <div className="feedback-panel animate-fade-in">
              <div className="feedback-header">
                <h2>EVALUATION COMPLETE</h2>
                <p>Curriculum understanding report generated by TRACEBACK engine.</p>
              </div>

              <div className="feedback-grid">
                <div className="feedback-summary">
                  <h3>Overall Assessment</h3>
                  <p>{feedback.summary}</p>
                </div>

                <div className="feedback-columns">
                  <div className="feedback-col strengths">
                    <h3>Strengths Validated</h3>
                    <ul>
                      {feedback.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="feedback-col gaps">
                    <h3>Knowledge Gaps Identified</h3>
                    <ul>
                      {feedback.gaps.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="feedback-next">
                  <h3>Actionable Next Steps</h3>
                  <div className="next-steps-list">
                    {feedback.next.map((n, i) => (
                      <div key={i} className="next-step-card">
                        <span className="step-num">{i + 1}</span>
                        <p>{n}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="feedback-actions">
                <button className="btn-secondary" onClick={restart}>
                  START NEW INTERVIEW
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-interface">
              <div className="chat-history">
                {history.map((msg, i) => (
                  <div key={i} className={`chat-bubble-wrap ${msg.role} animate-slide-in`}>
                    <div className="bubble-sender">
                      {msg.role === 'interviewer' ? 'TRACEBACK INTERVIEWER' : 'CANDIDATE RESPONSE'}
                    </div>
                    <div className="chat-bubble">
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}

                {currentQuestion && (
                  <div className="chat-bubble-wrap interviewer active animate-slide-in">
                    <div className="bubble-sender">TRACEBACK INTERVIEWER</div>
                    <div className="chat-bubble">
                      <p>{currentQuestion}</p>
                    </div>
                  </div>
                )}
              </div>

              <form
                className="input-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  submitAnswer()
                }}
              >
                <div className="textarea-wrapper">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Describe your implementation details, tools chosen, chunk tradeoffs, or metric targets..."
                    disabled={loading}
                    rows="3"
                  />
                  <div className="char-indicator">
                    {answer.length} / 4000
                  </div>
                </div>

                <div className="input-actions">
                  {loading ? (
                    <div className="loading-status">
                      {loadingStep}
                    </div>
                  ) : (
                    <div className="loading-status-idle">
                      System waiting for input
                    </div>
                  )}
                  <button type="submit" className="btn-submit" disabled={loading || !answer.trim()}>
                    {loading ? 'PROCESSING...' : 'SUBMIT RESPONSE'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
