/**
 * InterviewLayout — the main two-column interview screen.
 *
 * LEFT: candidate profile + intelligence indicators + TRACEBACK visualizer
 * RIGHT: conversation thread + input
 */

import { useEffect, useRef, useState } from 'react'
import TracebackVisualizer from './TracebackVisualizer'

function roleColor(role) {
  if (!role) return 'var(--accent)'
  const r = role.toLowerCase()
  if (r.includes('ai')) return '#a78bfa'
  if (r.includes('data')) return '#34d399'
  if (r.includes('backend') || r.includes('software')) return '#60a5fa'
  if (r.includes('devops') || r.includes('architect')) return '#f97316'
  return 'var(--accent)'
}

const STAGE_LABELS = {
  INITIALIZING: 'Preparing interview...',
  PROFILE_ANALYSIS: 'Analyzing profile...',
  QUESTIONING: 'Listening...',
  FOLLOW_UP: 'Follow-up question...',
  DEEP_DIVE: 'Going deeper...',
  CROSS_CHECK: 'Cross-checking claims...',
  FINAL_EVALUATION: 'Interview complete.',
  COMPLETED: 'Interview complete.',
}

// Message types for the chat thread
const ALL_DIMS = ['Fundamentals', 'Implementation', 'Tradeoffs', 'Debugging', 'Production', 'Security', 'Evaluation', 'System Design']

export default function InterviewLayout({
  candidate,
  history,
  currentQuestion,
  answer,
  onAnswerChange,
  onSubmit,
  loading,
  loadingStep,
  progress,
  error,
  onRetry,
  demoMode,
}) {
  const chatEndRef = useRef(null)
  const [charCount, setCharCount] = useState(0)
  const MAX_CHARS = 2000

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight
    }
  }, [history, currentQuestion, loading])

  // Sync charCount with answer prop
  useEffect(() => {
    setCharCount(answer.length)
  }, [answer])

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !loading && answer.trim()) {
      e.preventDefault()
      onSubmit()
    }
  }

  const m = candidate?.member || {}
  const qNum = progress?.questionNumber ?? 0
  const qTotal = progress?.totalQuestions ?? 10
  const pct = qTotal ? Math.min(100, Math.round((qNum / qTotal) * 100)) : 0
  const stage = progress?.stage || 'QUESTIONING'
  const stageLabel = STAGE_LABELS[stage] || 'In Progress'
  const areasExplored = progress?.areasExplored || ALL_DIMS.map((n) => ({ name: n, explored: false }))
  const exploredCount = areasExplored.filter((a) => a.explored).length
  const rColor = roleColor(m.jobRole)

  return (
    <div className="il-container animate-fade-in">
      {/* LEFT PANEL */}
      <aside className="il-left">
        {/* Candidate identity */}
        <div className="panel il-profile-card">
          <div className="il-cand-header">
            <div className="il-cand-avatar" style={{ borderColor: rColor, color: rColor }}>
              {m.name?.charAt(0)}
            </div>
            <div className="il-cand-info">
              <div className="il-cand-name">{m.name}</div>
              <span className="role-badge" style={{ background: `${rColor}18`, color: rColor }}>
                {m.jobRole}
              </span>
              <div className="il-cand-exp">{m.yearsExperience} yrs · {m.education}</div>
            </div>
          </div>

          {/* Stage indicator */}
          <div className="il-stage-row">
            <span className={`il-stage-dot ${loading ? 'stage-pulsing' : ''}`} />
            <span className="il-stage-label">{loading ? loadingStep || stageLabel : stageLabel}</span>
            {demoMode && <span className="demo-badge-sm">DEMO</span>}
          </div>
          <div className="il-profile-note">Don't just answer. Explain your reasoning and the tradeoffs behind your choice.</div>

          {/* Progress bar */}
          <div className="il-progress-block">
            <div className="il-progress-labels">
              <span>Progress</span>
              <span>{qNum} / {qTotal} questions</span>
            </div>
            <div className="il-progress-track">
              <div className="il-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* TRACEBACK pipeline visualizer */}
        <div className="panel il-tbv-panel">
          <TracebackVisualizer
            loading={loading}
            loadingStep={loadingStep}
            stage={stage}
            questionCount={qNum}
          />
        </div>

        {/* Coverage dimensions */}
        <div className="panel il-dims-panel">
          <div className="il-dims-header">
            <span className="il-dims-title">KNOWLEDGE DIMENSIONS</span>
            <span className="il-dims-count">{exploredCount}/{areasExplored.length} covered</span>
          </div>
          <div className="il-dims-grid">
            {areasExplored.map((a) => (
              <div
                key={a.name}
                className={`il-dim-chip ${a.explored ? 'il-dim-chip-on' : ''}`}
                title={a.explored ? `${a.name} — explored` : `${a.name} — pending`}
              >
                {a.explored && <span className="il-dim-check">✓</span>}
                {a.name}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className="il-right">
        {/* Error banner */}
        {error && (
          <div className="il-error animate-slide-in">
            <span className="il-error-icon">⚠</span>
            <div className="il-error-body">
              <div className="il-error-msg">{error}</div>
              <div className="il-error-hint">Your conversation is preserved. You can retry.</div>
            </div>
            <button className="il-retry-btn" type="button" onClick={onRetry} aria-label="Retry" >Retry</button>
          </div>
        )}

        {/* Chat panel */}
        <div className="il-chat-panel panel">
          <div className="il-chat-scroll" ref={chatEndRef}>
            {/* History */}
            {history.map((msg, i) => (
              <div key={i} className={`il-msg il-msg-${msg.role} animate-slide-in`}>
                <div className="il-msg-sender">
                  {msg.role === 'interviewer' ? 'TRACEBACK' : m.name?.split(' ')[0] || 'CANDIDATE'}
                </div>
                <div className="il-msg-bubble">{msg.text}</div>
              </div>
            ))}

            {/* Current question (live) */}
            {currentQuestion && !loading && (
              <div className="il-msg il-msg-interviewer il-msg-current animate-slide-in">
                <div className="il-msg-sender">TRACEBACK</div>
                <div className="il-msg-bubble">{currentQuestion}</div>
              </div>
            )}

            {/* Analyzing indicator */}
            {loading && (
              <div className="il-msg il-msg-interviewer animate-fade-in">
                <div className="il-msg-sender">TRACEBACK</div>
                <div className="il-typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          {/* Input form */}
          <div className="il-input-area">
            <div className={`il-textarea-wrap ${loading ? 'il-textarea-disabled' : ''}`}>
              <textarea
                value={answer}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) {
                    onAnswerChange(e.target.value)
                    setCharCount(e.target.value.length)
                  }
                }}
                onKeyDown={handleKey}
                placeholder={loading ? 'TRACEBACK is analyzing your response...' : 'Type your answer here... (Ctrl+Enter to submit)'}
                rows={4}
                disabled={loading}
                className="il-textarea"
              />
              <span className={`il-char-count ${charCount > MAX_CHARS * 0.9 ? 'il-char-warn' : ''}`}>
                {charCount} / {MAX_CHARS}
              </span>
            </div>
            <div className="il-input-footer">
              <span className="il-hint-text">
                {loading ? loadingStep || 'Processing...' : 'Press Ctrl+Enter or click Submit'}
              </span>
              <button
                type="button"
                className="btn-submit il-submit-btn"
                onClick={onSubmit}
                disabled={loading || !answer.trim()}
                aria-label="Submit answer"
              >
                {loading ? <span className="il-btn-spinner" /> : 'SUBMIT →'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
