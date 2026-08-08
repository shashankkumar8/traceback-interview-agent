/**
 * FeedbackScreen — end-of-interview results.
 * Shows assessment, strengths, gaps, next steps, and compact competency view.
 * No raw scoring exposed.
 */

function CompetencyChart({ areasExplored }) {
  if (!areasExplored?.length) return null
  const explored = areasExplored.filter((a) => a.explored)
  const pct = Math.round((explored.length / areasExplored.length) * 100)

  return (
    <div className="fb-competency-block">
      <div className="fb-comp-header">
        <span className="fb-comp-title">COMPETENCY COVERAGE</span>
        <span className="fb-comp-pct">{pct}% explored</span>
      </div>
      <div className="fb-comp-grid">
        {areasExplored.map((a) => (
          <div key={a.name} className={`fb-comp-chip ${a.explored ? 'fb-comp-on' : 'fb-comp-off'}`}>
            {a.explored && <span className="fb-comp-check">✓</span>}
            <span>{a.name}</span>
          </div>
        ))}
      </div>
      <div className="fb-comp-bar-wrap">
        <div className="fb-comp-bar">
          <div className="fb-comp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

export default function FeedbackScreen({ feedback, candidate, progress, onRestart }) {
  if (!feedback) return null
  const m = candidate?.member || {}

  return (
    <div className="fb-container animate-fade-in">
      {/* Header */}
      <div className="fb-header">
        <div className="fb-header-left">
          <div className="fb-complete-badge">
            <span>✓</span> INTERVIEW COMPLETE
          </div>
          <h1 className="fb-title">Assessment: {m.name}</h1>
          <p className="fb-role">{m.jobRole} · {m.yearsExperience} years experience</p>
        </div>
        <button className="btn-secondary fb-restart-btn" onClick={onRestart}>
          NEW INTERVIEW
        </button>
      </div>

      {/* Summary */}
      <div className="fb-summary-block">
        <div className="fb-section-label">OVERALL ASSESSMENT</div>
        <p className="fb-summary-text">{feedback.summary}</p>
      </div>

      {/* Competency coverage */}
      {progress?.areasExplored && (
        <CompetencyChart areasExplored={progress.areasExplored} />
      )}

      {/* Strengths & Gaps */}
      <div className="fb-cols">
        <div className="fb-col fb-col-strengths">
          <div className="fb-col-header">
            <span className="fb-col-icon">✓</span>
            <span className="fb-col-title">Strengths</span>
          </div>
          <ul className="fb-list">
            {(feedback.strengths || []).map((s, i) => (
              <li key={i} className="fb-list-item fb-strength-item">
                <span className="fb-item-dot fb-dot-green" />
                {s}
              </li>
            ))}
            {!feedback.strengths?.length && (
              <li className="fb-list-empty">No specific strengths recorded.</li>
            )}
          </ul>
        </div>

        <div className="fb-col fb-col-gaps">
          <div className="fb-col-header">
            <span className="fb-col-icon">⚠</span>
            <span className="fb-col-title">Knowledge Gaps</span>
          </div>
          <ul className="fb-list">
            {(feedback.gaps || []).map((g, i) => (
              <li key={i} className="fb-list-item fb-gap-item">
                <span className="fb-item-dot fb-dot-yellow" />
                {g}
              </li>
            ))}
            {!feedback.gaps?.length && (
              <li className="fb-list-empty">No significant gaps identified.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Next steps */}
      {feedback.next?.length > 0 && (
        <div className="fb-next-block">
          <div className="fb-section-label">RECOMMENDED NEXT STEPS</div>
          <div className="fb-next-grid">
            {feedback.next.map((step, i) => (
              <div key={i} className="fb-next-card">
                <div className="fb-next-num">{i + 1}</div>
                <p className="fb-next-text">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
