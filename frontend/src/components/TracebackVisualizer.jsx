/**
 * TracebackVisualizer — the core "wow" component for judges.
 * Shows the ANSWER → ANALYSIS → TRACEBACK → FOLLOW-UP pipeline
 * with live state progression.
 *
 * Exposes only safe high-level labels. No chain-of-thought is revealed.
 */

const STEPS = [
  {
    id: 'answer',
    icon: '💬',
    label: 'Answer Received',
    activeLabel: 'Listening...',
    desc: 'Candidate response captured',
  },
  {
    id: 'analysis',
    icon: '🔍',
    label: 'Analyzing Reasoning',
    activeLabel: 'Analyzing answer...',
    desc: 'Mapping claims vs evidence depth',
  },
  {
    id: 'traceback',
    icon: '🔎',
    label: 'Tracing Understanding',
    activeLabel: 'Tracing understanding...',
    desc: 'Identified knowledge gap',
  },
  {
    id: 'followup',
    icon: '⚡',
    label: 'Adaptive Follow-Up',
    activeLabel: 'Follow-up question...',
    desc: 'Deepening the question',
  },
]

/**
 * Maps app state to which pipeline step is active.
 *
 * @param {boolean} loading
 * @param {string} loadingStep  - the rotating label text
 * @param {string} stage        - progress.stage value from API
 */
function resolveActiveStep(loading, loadingStep, stage) {
  if (!loading) {
    if (stage === 'FOLLOW_UP') return 'followup'
    if (stage === 'QUESTIONING' || stage === 'PROFILE_ANALYSIS') return 'answer'
    return null
  }
  const step = loadingStep.toLowerCase()
  if (step.includes('analyz') || step.includes('reasoning') || step.includes('mapping') || step.includes('specificity')) return 'analysis'
  if (step.includes('trac') || step.includes('gap') || step.includes('claims')) return 'traceback'
  if (step.includes('formul') || step.includes('adaptive') || step.includes('follow')) return 'followup'
  return 'analysis'
}

export default function TracebackVisualizer({ loading, loadingStep, stage, questionCount }) {
  const activeId = resolveActiveStep(loading, loadingStep, stage)

  return (
    <div className="tbv-container">
      <div className="tbv-header">
        <span className="tbv-title">TRACEBACK PIPELINE</span>
        {questionCount > 0 && (
          <span className="tbv-q-badge">Q{questionCount}</span>
        )}
      </div>

      <div className="tbv-steps">
        {STEPS.map((step, i) => {
          const isActive = activeId === step.id
          const isPast = (
            STEPS.findIndex((s) => s.id === activeId) > i &&
            activeId !== null
          )

          return (
            <div key={step.id} className="tbv-step-wrap">
              <div className={`tbv-step ${isActive ? 'tbv-step-active' : ''} ${isPast ? 'tbv-step-past' : ''}`}>
                <div className="tbv-step-icon-wrap">
                  <span className="tbv-step-icon">{step.icon}</span>
                  {isActive && <span className="tbv-pulse-ring" />}
                </div>
                <div className="tbv-step-text">
                  <div className="tbv-step-label">
                    {isActive ? step.activeLabel : step.label}
                  </div>
                  <div className="tbv-step-desc">{step.desc}</div>
                </div>
                {isActive && loading && (
                  <div className="tbv-spinner" />
                )}
              </div>

              {i < STEPS.length - 1 && (
                <div className={`tbv-connector ${isPast || isActive ? 'tbv-connector-lit' : ''}`}>
                  <div className="tbv-arrow">↓</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {loading && loadingStep && (
        <div className="tbv-status-bar">
          <span className="tbv-status-dot" />
          <span className="tbv-status-text">{loadingStep}</span>
        </div>
      )}
    </div>
  )
}
