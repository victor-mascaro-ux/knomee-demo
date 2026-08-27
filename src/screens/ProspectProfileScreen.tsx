import { useState } from 'react'
import './prospectProfile.css'
import { financialId } from '../data/financialId'
import type { Prospect } from '../data/prospects'

type ProfileTab = 'id' | 'readiness' | 'playbook'

function ReadinessBars({ level }: { level: number }) {
  return (
    <span className="pp-bars" aria-label={`Readiness ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`pp-bar ${i <= level ? 'on' : ''}`} style={{ height: 5 + i * 2.4 }} />
      ))}
    </span>
  )
}

function Gauge({ label }: { label: string }) {
  // A simple 180° gauge with the needle a little past center ("Strong").
  return (
    <span className="pp-gauge" aria-label={`Confidence: ${label}`}>
      <svg viewBox="0 0 100 56" width="86" height="48">
        <path d="M6 50 A44 44 0 0 1 94 50" fill="none" stroke="#ece7f4" strokeWidth="10" strokeLinecap="round" />
        <path d="M6 50 A44 44 0 0 1 78 20" fill="none" stroke="#7c4dc4" strokeWidth="10" strokeLinecap="round" />
        <circle cx="50" cy="50" r="4.5" fill="#3b2d63" />
        <line x1="50" y1="50" x2="76" y2="26" stroke="#3b2d63" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export default function ProspectProfileScreen({
  prospect,
  onBack,
  onConvert,
}: {
  prospect: Prospect
  onBack: () => void
  onConvert: (p: Prospect) => void
}) {
  const [tab, setTab] = useState<ProfileTab>('id')
  const initial = prospect.name.charAt(0).toUpperCase()
  const fi = financialId

  return (
    <div className="pp">
      <nav className="pp-crumb">
        <button type="button" className="pp-crumb-link" onClick={onBack}>
          My Prospects
        </button>
        <span className="pp-crumb-sep">›</span>
        <span className="pp-crumb-cur">{prospect.name}</span>
      </nav>

      <div className="pp-layout">
        {/* Left profile sidebar */}
        <aside className="pp-side">
          <div className="pp-avatar">
            {prospect.avatar ? <img src={prospect.avatar} alt="" /> : <span>{initial}</span>}
          </div>
          <h2 className="pp-name">{prospect.name}</h2>
          <div className="pp-meta">
            <span className="pp-meta-row">📅 Joined {fi.joined}</span>
            <span className="pp-meta-row">✉️ {prospect.email}</span>
          </div>
          <button className="pp-convert" type="button" onClick={() => onConvert(prospect)}>
            ⚡ Convert to Client
          </button>
        </aside>

        {/* Main column */}
        <main className="pp-main">
          <div className="pp-tabs">
            {(
              [
                ['id', 'Financial ID'],
                ['readiness', 'Prospect Readiness'],
                ['playbook', 'Prospect Playbook'],
              ] as [ProfileTab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`pp-tab ${tab === id ? 'is-active' : ''}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="pp-title-row">
            <h1 className="pp-title">{prospect.name}’s Financial ID</h1>
            <button className="pp-download" type="button">
              ⬇ Download PDF
            </button>
          </div>

          {tab !== 'id' ? (
            <div className="pp-placeholder">
              {tab === 'readiness' ? 'Prospect Readiness' : 'Prospect Playbook'} — coming soon.
            </div>
          ) : (
            <>
              {/* Key Highlights */}
              <section className="pp-card">
                <div className="pp-card-head">
                  <span className="pp-card-title">💡 Key Highlights</span>
                </div>
                <div className="pp-highlights">
                  {fi.keyHighlights.map((h) => (
                    <div className="pp-highlight" key={h.title}>
                      <div className="pp-highlight-title">
                        <span className="pp-hl-icon">{h.icon}</span>
                        {h.title}
                      </div>
                      <p className="pp-highlight-text">{h.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="pp-cols">
                {/* Left content column */}
                <div className="pp-col-main">
                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">🎯 Goals</span>
                      <span className="pp-add">＋</span>
                    </div>
                    <div className="pp-goals">
                      {fi.goals.map((g) => (
                        <div className={`pp-goal ${g.completed ? 'is-done' : ''}`} key={g.title}>
                          <div className="pp-goal-main">
                            <span className="pp-goal-title">{g.title}</span>
                            {g.completed && (
                              <span className="pp-goal-done">✓ Completed: {g.completed}</span>
                            )}
                          </div>
                          <ReadinessBars level={g.readiness} />
                          <span className="pp-goal-caret">›</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">💠 Financial Joy</span>
                    </div>
                    <p className="pp-prompt">{fi.financialJoy.prompt}</p>
                    <div className="pp-chips">
                      {fi.financialJoy.chips.map((c) => (
                        <span className="pp-chip" key={c}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">🧭 Future You</span>
                    </div>
                    {(
                      [
                        ['Where', fi.futureYou.where],
                        ['What', fi.futureYou.what],
                        ['Who', fi.futureYou.who],
                      ] as [string, string[]][]
                    ).map(([label, items]) => (
                      <div className="pp-fy-group" key={label}>
                        <span className="pp-fy-label">{label}</span>
                        <div className="pp-chips">
                          {items.map((it) => (
                            <span className="pp-chip" key={it}>
                              {it}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">🌸 Outlook</span>
                    </div>
                    <span className="pp-fy-label pp-concern">Concerns</span>
                    {fi.outlook.concerns.map((c) => (
                      <p className="pp-quote" key={c}>
                        “{c}”
                      </p>
                    ))}
                    <span className="pp-fy-label pp-hope">Hopes</span>
                    {fi.outlook.hopes.map((h) => (
                      <p className="pp-quote" key={h}>
                        “{h}”
                      </p>
                    ))}
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">🏅 Badges</span>
                    </div>
                    <div className="pp-badges">
                      {fi.badges.map((b) => (
                        <div className="pp-badge" key={b.label}>
                          <span className="pp-badge-disc" style={{ background: b.color }}>
                            {b.icon}
                          </span>
                          <span className="pp-badge-label">{b.label}</span>
                          <span className="pp-badge-sub">Adventure Complete</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right rail */}
                <div className="pp-rail">
                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">☀️ Confidence</span>
                      <span className="pp-date">05/03/2025 ⌄</span>
                    </div>
                    <div className="pp-confidence">
                      <span className="pp-confidence-label">{fi.confidence}</span>
                      <Gauge label={fi.confidence} />
                    </div>
                    <button className="pp-show" type="button">
                      Show results ⌄
                    </button>
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">📅 Life Events</span>
                      <span className="pp-add">＋</span>
                    </div>
                    <div className="pp-events">
                      {fi.lifeEvents.map((e, i) => (
                        <div className="pp-event" key={i}>
                          <span className="pp-event-tag">{e.tag}</span>
                          <span className="pp-event-kind">{e.kind}</span>
                          <span className="pp-event-text">{e.text}</span>
                          <span className="pp-event-date">🕓 {e.date}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title">💬 Questions</span>
                      <span className="pp-add">＋</span>
                    </div>
                    <div className="pp-questions">
                      {fi.questions.map((q, i) => (
                        <div className={`pp-question ${q.resolved ? 'is-resolved' : ''}`} key={i}>
                          <span className="pp-q-text">{q.q}</span>
                          <span className="pp-q-date">
                            {q.resolved ? `✓ Resolved: ${q.resolved}` : q.date}
                          </span>
                          <span className="pp-goal-caret">›</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
