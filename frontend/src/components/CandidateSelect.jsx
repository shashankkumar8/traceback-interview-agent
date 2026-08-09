import { useMemo } from 'react'

function completionPct(candidate) {
  const m = candidate.missions || []
  if (!m.length) return 0
  const passed = m.filter((x) => x.passed).length
  return Math.round((passed / m.length) * 100)
}

function roleColor(role) {
  if (!role) return 'var(--accent)'
  if (role.toLowerCase().includes('ai')) return '#a78bfa'
  if (role.toLowerCase().includes('data')) return '#34d399'
  if (role.toLowerCase().includes('backend') || role.toLowerCase().includes('software')) return '#60a5fa'
  if (role.toLowerCase().includes('devops') || role.toLowerCase().includes('architect')) return '#f97316'
  return 'var(--accent)'
}

function CompletionBar({ pct }) {
  const color = pct >= 90 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div className="completion-bar-wrap">
      <div className="completion-bar-track">
        <div className="completion-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="completion-pct" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function CandidateSelect({ candidates, selectedId, onSelect, onNext, demoMode }) {
  const selected = candidates.find((c) => c.member?.id === selectedId)
  const pct = selected ? completionPct(selected) : 0

  const sorted = useMemo(() => {
    return [...candidates].sort((a, b) => {
      const ap = completionPct(a)
      const bp = completionPct(b)
      return bp - ap
    })
  }, [candidates])

  return (
    <div className="cs-container animate-fade-in">
      <div className="cs-header">
        <div className="cs-title-block">
          <div className="brand-logo cs-brand">TRACE<span className="cyan-highlight">BACK</span></div>
          <p className="cs-subtitle">Select a candidate to begin the AI-driven interview assessment.</p>
        </div>
        {demoMode && <span className="demo-badge">OFFLINE DEMO MODE</span>}
      </div>

      <div className="cs-layout">
        {/* Candidate list */}
        <div className="cs-list">
          <div className="cs-list-header">
            <span className="cs-list-label">CANDIDATES</span>
            <span className="cs-list-count">{candidates.length} profiles</span>
          </div>
          <div className="cs-scroll">
            {sorted.map((c) => {
              const p = completionPct(c)
              const isSelected = c.member?.id === selectedId
              return (
                <button
                  key={c.member?.id}
                  type="button"
                  className={`cs-row ${isSelected ? 'cs-row-active' : ''}`}
                  onClick={() => onSelect(c.member?.id)}
                  aria-pressed={isSelected}
                >
                  <div
                    className="cs-avatar"
                    style={{ borderColor: roleColor(c.member?.jobRole), color: roleColor(c.member?.jobRole) }}
                  >
                    {c.member?.name?.charAt(0)}
                  </div>
                  <div className="cs-row-info">
                    <div className="cs-row-name">{c.member?.name}</div>
                    <div className="cs-row-role" style={{ color: roleColor(c.member?.jobRole) }}>
                      {c.member?.jobRole}
                    </div>
                  </div>
                  <div className="cs-row-right">
                    <div className="cs-row-exp">{c.member?.yearsExperience}y exp</div>
                    <CompletionBar pct={p} />
                  </div>
                  {isSelected && <div className="cs-row-indicator" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Profile card */}
        {selected ? (
          <div className="cs-detail animate-slide-in">
            <div className="cs-detail-top">
              <div className="cs-detail-avatar" style={{ borderColor: roleColor(selected.member?.jobRole) }}>
                <span style={{ color: roleColor(selected.member?.jobRole) }}>{selected.member?.name?.charAt(0)}</span>
              </div>
              <div>
                <h2 className="cs-detail-name">{selected.member?.name}</h2>
                <span className="role-badge" style={{ background: `${roleColor(selected.member?.jobRole)}18`, color: roleColor(selected.member?.jobRole) }}>
                  {selected.member?.jobRole}
                </span>
              </div>
            </div>

            <div className="cs-stats-row">
              <div className="cs-stat">
                <label>Experience</label>
                <span>{selected.member?.yearsExperience} yrs</span>
              </div>
              <div className="cs-stat">
                <label>Education</label>
                <span>{selected.member?.education}</span>
              </div>
              <div className="cs-stat">
                <label>Commit Days</label>
                <span>{selected.signals?.commitDays}</span>
              </div>
              <div className="cs-stat">
                <label>Missions Done</label>
                <span>{selected.signals?.missionsCompleted}</span>
              </div>
            </div>

            <div className="cs-completion-row">
              <span className="cs-comp-label">Mission Completion</span>
              <CompletionBar pct={pct} />
            </div>

            <div className="cs-missions">
              <div className="cs-missions-label">CURRICULUM HISTORY</div>
              <div className="cs-mission-list">
                {(selected.missions || []).map((m, i) => {
                  const status = m.passed ? 'passed' : m.skipped ? 'skipped' : 'struggled'
                  return (
                    <div key={i} className={`cs-mission-item cs-mission-${status}`}>
                      <div className="cs-mission-dot" />
                      <div className="cs-mission-body">
                        <span className="cs-mission-title">{m.title || `Day ${m.day}`}</span>
                        <span className="cs-mission-meta">
                          {status === 'passed' ? 'Passed' : status === 'skipped' ? 'Skipped' : 'Struggled'} · {m.attempts ?? 1} attempt{m.attempts !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <button className="btn-start cs-btn-start" type="button" onClick={onNext}>
              GENERATE INTERVIEW BRIEF →
            </button>
          </div>
        ) : (
          <div className="cs-empty">
            <div className="cs-empty-icon">⬅</div>
            <p>Select a candidate to view their profile</p>
          </div>
        )}
      </div>
    </div>
  )
}
