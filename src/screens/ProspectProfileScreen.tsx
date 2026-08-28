import { useEffect, useState } from 'react'
import './prospectProfile.css'
import { financialId } from '../data/financialId'
import type { Prospect } from '../data/prospects'
import { DownloadIcon } from '../components/icons'
import addIcon from '../assets/adventures/add.svg'
import icFinancialJoy from '../assets/adventures/financial-joy.svg'
import icConfidence from '../assets/adventures/confidence.svg'
import icOutlook from '../assets/adventures/outlook.svg'
import icFutureYou from '../assets/adventures/future-you.svg'
import icGoals from '../assets/adventures/goals.svg'
import icQuestions from '../assets/adventures/questions.svg'
import icLifeEvents from '../assets/adventures/life-events.svg'

const ADVENTURE_ICON: Record<string, string> = {
  'Financial Joy': icFinancialJoy,
  Confidence: icConfidence,
  Outlook: icOutlook,
  'Future You': icFutureYou,
  Goals: icGoals,
}

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
  // A 180° gauge with a light→deep purple sweep and a needle a little past
  // center ("Strong"), matching the product's confidence dial.
  return (
    <span className="pp-gauge" aria-label={`Confidence: ${label}`}>
      <svg viewBox="0 0 120 68" width="108" height="61">
        <defs>
          <linearGradient id="pp-gauge-grad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#cbb0f0" />
            <stop offset="1" stopColor="#6d28c9" />
          </linearGradient>
        </defs>
        <path d="M8 60 A52 52 0 0 1 112 60" fill="none" stroke="#ece7f4" strokeWidth="12" strokeLinecap="round" />
        <path d="M8 60 A52 52 0 0 1 99 24" fill="none" stroke="url(#pp-gauge-grad)" strokeWidth="12" strokeLinecap="round" />
        <circle cx="60" cy="60" r="6" fill="#2b2140" />
        <line x1="60" y1="60" x2="96" y2="28" stroke="#2b2140" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </span>
  )
}

const BADGE_TINT: Record<string, string> = {
  'Financial Joy': '#bfe6dd',
  Confidence: '#fbe3a6',
  Outlook: '#f6c6d4',
  'Future You': '#d2ecbe',
  Goals: '#c6e2f6',
}

// A scalloped "seal" medallion: a wavy colored ring with the adventure icon in
// the middle and the category / "ADVENTURE COMPLETE" curved around it, like the
// real product's badges.
function BadgeMedallion({ label, icon }: { label: string; icon: string }) {
  const tint = BADGE_TINT[label] ?? '#e6e6ee'
  const slug = label.replace(/\s+/g, '-').toLowerCase()
  const cx = 60
  const cy = 60
  const R = 46
  const n = 18
  const bump = 6.5
  const bumps = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI
    return <circle key={i} cx={cx + R * Math.cos(a)} cy={cy + R * Math.sin(a)} r={bump} fill={tint} />
  })
  return (
    <span className="pp-badge-disc">
      <svg viewBox="0 0 120 120" width="90" height="90">
        <defs>
          <path id={`pp-top-${slug}`} d="M 22 60 A 38 38 0 0 1 98 60" fill="none" />
          <path id={`pp-bot-${slug}`} d="M 24 60 A 36 36 0 0 0 96 60" fill="none" />
        </defs>
        {bumps}
        <circle cx={cx} cy={cy} r={R} fill={tint} />
        <text className="pp-badge-arc">
          <textPath href={`#pp-top-${slug}`} startOffset="50%" textAnchor="middle">
            {label.toUpperCase()}
          </textPath>
        </text>
        <text className="pp-badge-arc">
          <textPath href={`#pp-bot-${slug}`} startOffset="50%" textAnchor="middle">
            ADVENTURE COMPLETE
          </textPath>
        </text>
        <image href={icon} x={cx - 27} y={cy - 27} width="54" height="54" />
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

  // Open the profile scrolled to the top, regardless of where the prospect's
  // row sat in the table when it was clicked. On the live site the app runs in
  // a full-height iframe and the PARENT page scrolls, so reset that too — and
  // re-assert after the parent resizes the iframe to the (shorter) profile.
  useEffect(() => {
    const toTop = () => {
      window.scrollTo(0, 0)
      const el = document.scrollingElement || document.documentElement
      if (el) el.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
      try {
        if (window.parent && window.parent !== window) window.parent.scrollTo(0, 0)
      } catch {
        /* cross-origin parent — ignore */
      }
    }
    toTop()
    const raf = requestAnimationFrame(toTop)
    const t = window.setTimeout(toTop, 150)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t)
    }
  }, [prospect.name])

  return (
    <div className="pp">
      <div className="pp-layout">
        {/* Left profile sidebar — a full-height static strip */}
        <aside className="pp-side">
          <div className="pp-side-inner">
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
          </div>
        </aside>

        {/* Main column */}
        <main className="pp-main">
          <nav className="pp-crumb">
            <button type="button" className="pp-crumb-link" onClick={onBack}>
              My Prospects
            </button>
            <span className="pp-crumb-sep">›</span>
            <span className="pp-crumb-cur">{prospect.name}</span>
          </nav>
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
            <button className="btn btn-download active" type="button">
              <DownloadIcon /> Download PDF
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
                      <span className="pp-card-title"><img className="pp-card-ic" src={icGoals} alt="" />Goals</span>
                      <img className="pp-add" src={addIcon} alt="Add" />
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
                      <span className="pp-card-title"><img className="pp-card-ic" src={icFinancialJoy} alt="" />Financial Joy</span>
                      <span className="pp-date">05/03/2025 ⌄</span>
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
                      <span className="pp-card-title"><img className="pp-card-ic" src={icFutureYou} alt="" />Future You</span>
                      <span className="pp-date">05/03/2025 ⌄</span>
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
                      <span className="pp-card-title"><img className="pp-card-ic" src={icOutlook} alt="" />Outlook</span>
                      <span className="pp-date">05/03/2025 ⌄</span>
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
                      {fi.badges.map((label) => (
                        <div className="pp-badge" key={label}>
                          <BadgeMedallion label={label} icon={ADVENTURE_ICON[label]} />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right rail */}
                <div className="pp-rail">
                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title"><img className="pp-card-ic" src={icConfidence} alt="" />Confidence</span>
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
                      <span className="pp-card-title"><img className="pp-card-ic" src={icLifeEvents} alt="" />Life Events</span>
                      <img className="pp-add" src={addIcon} alt="Add" />
                    </div>
                    <div className="pp-events">
                      {fi.lifeEvents.map((e, i) => (
                        <div className="pp-event" key={i}>
                          <span className="pp-event-tag">{e.tag}</span>
                          <span className="pp-event-kind">{e.kind}</span>
                          <span className="pp-event-text">{e.text}</span>
                          <span className="pp-event-date">{e.date}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-head">
                      <span className="pp-card-title"><img className="pp-card-ic" src={icQuestions} alt="" />Questions</span>
                      <img className="pp-add" src={addIcon} alt="Add" />
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
