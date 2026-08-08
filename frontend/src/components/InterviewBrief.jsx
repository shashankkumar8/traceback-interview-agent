/**
 * InterviewBrief — interviewer preparation screen shown before starting.
 * Shows candidate summary + algorithmically derived focus areas from their
 * curriculum history. Does NOT expose raw scores.
 */

function derivesFocusAreas(candidate) {
  const areas = []
  const missions = candidate.missions || []
  const signals = candidate.signals || {}
  const role = candidate.member?.jobRole || ''

  // Skipped missions are strong signals to probe
  const skipped = missions.filter((m) => m.skipped && m.title)
  if (skipped.length) {
    areas.push({
      label: `Unvisited module probe`,
      detail: skipped.slice(0, 2).map((m) => m.title).join(', '),
      tag: 'GAP',
    })
  }

  // High-attempt missions suggest friction
  const struggled = missions.filter(
    (m) => !m.skipped && m.passed === false
  )
  const highAttempt = missions.filter((m) => (m.attempts || 1) >= 4 && m.passed)
  const friction = [...struggled, ...highAttempt]
  if (friction.length) {
    areas.push({
      label: 'Knowledge friction verification',
      detail: friction.slice(0, 2).map((m) => m.title).join(', '),
      tag: 'VERIFY',
    })
  }

  // Role-based focus areas
  const roleLower = role.toLowerCase()
  if (roleLower.includes('ai') || roleLower.includes('machine learning')) {
    areas.push({ label: 'RAG pipeline & embedding retrieval strategy', detail: 'Embeddings, vector search, chunk tuning', tag: 'CORE' })
    areas.push({ label: 'Agentic frameworks & tool execution', detail: 'LangChain, MCP, orchestration patterns', tag: 'CORE' })
  } else if (roleLower.includes('data')) {
    areas.push({ label: 'Data pipeline integration with LLM services', detail: 'Ingestion, transformation, vector indexing', tag: 'CORE' })
    areas.push({ label: 'Evaluation and observability patterns', detail: 'Metrics, tracing, production monitoring', tag: 'CORE' })
  } else if (roleLower.includes('backend') || roleLower.includes('software')) {
    areas.push({ label: 'API contract design for AI services', detail: 'FastAPI, structured outputs, async patterns', tag: 'CORE' })
    areas.push({ label: 'Containerization and deployment strategy', detail: 'Docker, Kubernetes, environment config', tag: 'CORE' })
  } else if (roleLower.includes('devops') || roleLower.includes('architect')) {
    areas.push({ label: 'Production AI system reliability', detail: 'Observability, scaling, failure modes', tag: 'CORE' })
    areas.push({ label: 'Infrastructure and LLM cost management', detail: 'Rate limits, caching, deployment pipelines', tag: 'CORE' })
  } else {
    areas.push({ label: 'LLM fundamentals and prompt engineering', detail: 'Completion, structured outputs, grounding', tag: 'CORE' })
  }

  // First-try ratio
  const firstTryRatio = signals.missionsCompleted > 0
    ? (signals.missionsFirstTry || 0) / signals.missionsCompleted
    : 0
  if (firstTryRatio < 0.5) {
    areas.push({ label: 'Depth vs. surface understanding probe', detail: 'Low first-try ratio detected — validate working knowledge depth', tag: 'PROBE' })
  }

  return areas.slice(0, 5)
}

const TAG_COLORS = {
  CORE: { bg: 'rgba(0,229,255,0.1)', color: 'var(--accent)' },
  GAP: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
  VERIFY: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  PROBE: { bg: 'rgba(167,139,250,0.1)', color: '#a78bfa' },
}

export default function InterviewBrief({ candidate, onStart, onBack, loading }) {
  if (!candidate) return null
  const m = candidate.member || {}
  const focusAreas = derivesFocusAreas(candidate)

  return (
    <div className="brief-container animate-fade-in">
      <div className="brief-card">
        <div className="brief-card-header">
          <div className="brief-header-icon">📋</div>
          <div>
            <h2 className="brief-title">Interviewer Brief</h2>
            <p className="brief-subtitle">Candidate-aware preparation summary — do not share with candidate</p>
          </div>
        </div>

        <div className="brief-body">
          {/* Identity block */}
          <div className="brief-section brief-identity">
            <div className="brief-id-row">
              <div className="brief-avatar">{m.name?.charAt(0)}</div>
              <div>
                <div className="brief-name">{m.name}</div>
                <div className="brief-role">{m.jobRole}</div>
              </div>
            </div>
            <div className="brief-meta-grid">
              <div className="brief-meta-item">
                <span className="brief-meta-label">Experience</span>
                <span className="brief-meta-value">{m.yearsExperience} years</span>
              </div>
              <div className="brief-meta-item">
                <span className="brief-meta-label">Education</span>
                <span className="brief-meta-value">{m.education}</span>
              </div>
              <div className="brief-meta-item">
                <span className="brief-meta-label">Commitment</span>
                <span className="brief-meta-value">{candidate.signals?.commitDays} / 31 days</span>
              </div>
              <div className="brief-meta-item">
                <span className="brief-meta-label">First-Try Rate</span>
                <span className="brief-meta-value">
                  {candidate.signals?.missionsCompleted > 0
                    ? Math.round((candidate.signals.missionsFirstTry / candidate.signals.missionsCompleted) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Focus areas */}
          <div className="brief-section">
            <div className="brief-section-title">FOCUS AREAS FOR THIS SESSION</div>
            <div className="brief-focus-list">
              {focusAreas.map((area, i) => {
                const tagStyle = TAG_COLORS[area.tag] || TAG_COLORS.CORE
                return (
                  <div key={i} className="brief-focus-item">
                    <div className="brief-focus-number">{i + 1}</div>
                    <div className="brief-focus-body">
                      <div className="brief-focus-label">{area.label}</div>
                      <div className="brief-focus-detail">{area.detail}</div>
                    </div>
                    <span
                      className="brief-focus-tag"
                      style={{ background: tagStyle.bg, color: tagStyle.color }}
                    >
                      {area.tag}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* TRACEBACK note */}
          <div className="brief-note">
            <span className="brief-note-icon">⚡</span>
            TRACEBACK will adaptively probe candidate answers in real-time, tracing back claims to verify genuine understanding.
          </div>
        </div>

        <div className="brief-actions">
          <button className="btn-secondary brief-back-btn" onClick={onBack} disabled={loading}>
            ← BACK
          </button>
          <button className="btn-start brief-start-btn" onClick={onStart} disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="spin-dot" />
                Preparing interview...
              </span>
            ) : (
              'BEGIN ASSESSMENT →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
