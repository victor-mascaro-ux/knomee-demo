/* The candidate profile on the FIRM side — what a Dynasty rep reads about one
   advisor. Modelled on ProspectProfileScreen so the two products share a
   vocabulary of cards, tabs and rails, but the content is a different
   decision: this person is being recruited, not sold to.

   Tab 1 renders `independenceId` straight out of the advisor flow. Tabs 2 and
   3 read `advisorProfile.ts`, where the scores are authored once and every
   other figure is computed from them. */

import { useEffect, useState } from 'react'
import './prospectProfile.css'
import './advisorProfile.css'
import { advisor, independenceId } from '../data/advisorFlow'
import {
  apprehensions,
  bookProfile,
  bookProfileRead,
  columnActions,
  compClock,
  dimensions,
  engagementLevel,
  hisQuestions,
  kq,
  motivators,
  questionsTheyAsk,
  recommendationsKey,
  repTakeaway,
  route,
  secondSeat,
  starters,
  tier,
  tierBanner,
  topAction,
  velocity,
  verbosity,
  words,
} from '../data/advisorProfile'
import { Gauge, HighlightIcon, ReadinessLevel, TTM_STAGES } from './profileParts'
import { DownloadIcon } from '../components/icons'
import { CalendarIcon, CheckIcon } from '../components/profileIcons'
import icKeyHighlights from '../assets/adventures/key-highlights.svg'
import icPracticeJoy from '../assets/adventures/financial-joy.svg'
import icConfidence from '../assets/adventures/confidence.svg'
import icOutlook from '../assets/adventures/outlook.svg'
import icFutureYou from '../assets/adventures/future-you.svg'
import icTheMove from '../assets/adventures/goals.svg'
import icQuestions from '../assets/adventures/questions.svg'
import icBadges from '../assets/badges/badges-icon.svg'

type ProfileTab = 'id' | 'readiness' | 'playbook'

const TAB_LABEL: Record<ProfileTab, string> = {
  id: 'Independence ID',
  readiness: 'Advisor Readiness',
  playbook: 'Recruiting Playbook',
}

/* The five adventures, and the artwork each badge wears. The client badges are
   finished medallions with their own names set into the vector, so the advisor
   set cannot borrow them — these are the adventure illustrations on a disc,
   naming themselves underneath. */
const BADGE_ART: Record<string, string> = {
  'Practice Joy': icPracticeJoy,
  Confidence: icConfidence,
  Outlook: icOutlook,
  'Future You': icFutureYou,
  'The Move': icTheMove,
}

function CardHead({ icon, title, right }: { icon: string; title: string; right?: string }) {
  return (
    <div className="pp-card-head">
      <span className="pp-card-title">
        <img className="pp-card-ic" src={icon} alt="" />
        {title}
      </span>
      {right && <span className="ap-card-note">{right}</span>}
    </div>
  )
}

/** Every card that states something has to say what the rep does about it. */
function Action({ children }: { children: string }) {
  return (
    <p className="ap-action">
      <span className="ap-action-tag">Do</span>
      {children}
    </p>
  )
}

export default function AdvisorProfileScreen({
  onBack,
  onAdd,
}: {
  onBack: () => void
  onAdd?: () => void
}) {
  const [tab, setTab] = useState<ProfileTab>('id')
  const d = independenceId
  const stageLevel = TTM_STAGES.indexOf(d.readiness.stage) + 1

  // Open scrolled to the top however far down the table the row sat. On the
  // live site the app runs in an iframe and the PARENT page scrolls, so reset
  // that too, and re-assert after the parent resizes the frame.
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
  }, [])

  return (
    <div className="pp ap">
      <div className="pp-layout">
        {/* Left profile sidebar */}
        <aside className="pp-side">
          <div className="pp-side-inner">
            <div className="pp-avatar">
              <span>{advisor.initial}</span>
            </div>
            <h2 className="pp-name">{advisor.name}</h2>
            <div className="pp-meta">
              <span className="pp-meta-row">{advisor.role}</span>
              <span className="pp-meta-row">
                {advisor.book} · {advisor.firm}
              </span>
              <span className="pp-meta-row">
                <CalendarIcon /> Completed {d.header.completed}
              </span>
            </div>
            <button className="pp-convert" type="button" onClick={() => onAdd?.()}>
              Add to Network
            </button>
            <div className="ap-side-stat">
              <span className="ap-side-stat-k">Knomee Quotient</span>
              <span className="ap-side-stat-v">
                {kq}
                <i>
                  Tier {tier.tier} · {tier.name}
                </i>
              </span>
            </div>
            <div className="ap-side-stat">
              <span className="ap-side-stat-k">Route</span>
              <span className="ap-side-stat-v ap-side-stat-text">{route.pick}</span>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <main className="pp-main">
          <nav className="pp-crumb">
            <button type="button" className="pp-crumb-link" onClick={onBack}>
              My Candidates
            </button>
            <span className="pp-crumb-sep">›</span>
            <span className="pp-crumb-cur">{advisor.name}</span>
          </nav>
          <div className="pp-tabs">
            {(Object.keys(TAB_LABEL) as ProfileTab[]).map((id) => (
              <button
                key={id}
                type="button"
                className={`pp-tab ${tab === id ? 'is-active' : ''}`}
                onClick={() => setTab(id)}
              >
                {TAB_LABEL[id]}
              </button>
            ))}
          </div>

          <div className="pp-title-row">
            <h1 className="pp-title">
              {tab === 'id' ? `${advisor.name}’s Independence ID` : TAB_LABEL[tab]}
            </h1>
            <button className="btn btn-download active" type="button">
              <DownloadIcon /> Download PDF
            </button>
          </div>

          {tab === 'id' && <IndependenceIdTab stageLevel={stageLevel} />}
          {tab === 'readiness' && <ReadinessTab />}
          {tab === 'playbook' && <PlaybookTab />}
        </main>
      </div>
    </div>
  )
}

/* ── Tab 1 — Independence ID ─────────────────────────────────────────────
   Structurally the Financial ID: highlights across the top, then a content
   column and a rail. Goals, Life Events and Questions have no advisor
   equivalent yet, so they are absent rather than filled with invention. */

function IndependenceIdTab({ stageLevel }: { stageLevel: number }) {
  const d = independenceId
  const [confidence, setConfidence] = useState(false)
  return (
    <>
      <section className="pp-card">
        <CardHead icon={icKeyHighlights} title="Key Highlights" />
        <div className="pp-highlights">
          {d.highlights.map((h) => (
            <div className="pp-highlight" key={h.title}>
              <div className="pp-highlight-title">
                <HighlightIcon source={h.icon} />
                {h.title}
              </div>
              <p className="pp-highlight-text">{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="pp-cols">
        <div className="pp-col-main">
          <section className="pp-card">
            <CardHead icon={icPracticeJoy} title="Practice Joy" />
            <p className="pp-prompt">{d.practiceJoy.prompt}</p>
            <div className="pp-chips">
              {d.practiceJoy.chips.map((c) => (
                <span className="pp-chip" key={c}>
                  {c}
                </span>
              ))}
            </div>
          </section>

          <section className="pp-card">
            <CardHead icon={icPracticeJoy} title="Attention" />
            <p className="pp-prompt">Where he wants his days to go</p>
            <div className="ap-attention">
              <div>
                <span className="pp-fy-label">More</span>
                {d.attention.more.map((m) => (
                  <div className="ap-attn-row ap-attn-more" key={m}>
                    {m}
                  </div>
                ))}
              </div>
              <div>
                <span className="pp-fy-label">Less</span>
                {d.attention.less.map((m) => (
                  <div className="ap-attn-row ap-attn-less" key={m}>
                    {m}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="pp-card">
            <CardHead icon={icFutureYou} title="Future You" />
            {(
              [
                ['Where', d.futureYou.where],
                ['What', d.futureYou.what],
                ['Who', d.futureYou.who],
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
            <CardHead icon={icOutlook} title="Outlook" />
            <span className="pp-fy-label">Concerns</span>
            {d.outlook.concerns.map((c) => (
              <p className="pp-quote" key={c}>
                “{c}”
              </p>
            ))}
            <span className="pp-fy-label pp-hope">Hopes</span>
            {d.outlook.hopes.map((h) => (
              <p className="pp-quote" key={h}>
                “{h}”
              </p>
            ))}
          </section>

          <section className="pp-card">
            <CardHead icon={icBadges} title="Badges" />
            <div className="ap-badges">
              {d.badges.map((label) => (
                <div className="ap-badge" key={label}>
                  <span className="ap-badge-disc">
                    <img src={BADGE_ART[label]} alt="" />
                  </span>
                  <span className="ap-badge-label">{label}</span>
                  <span className="ap-badge-done">
                    <CheckIcon size={10} /> Complete
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right rail */}
        <div className="pp-rail">
          <section className="pp-card">
            <CardHead icon={icTheMove} title="Readiness" />
            <div className="ap-stage">
              <span className="ap-stage-name">{d.readiness.stage}</span>
              <ReadinessLevel level={stageLevel} />
            </div>
            <p className="ap-stage-note">{d.readiness.note}</p>
            <div className="ap-conf">
              <span className="pp-fy-label">Confidence band</span>
              <div className="pp-confidence">
                <span className="pp-confidence-label">{d.readiness.confidence}</span>
                <Gauge label={d.readiness.confidence} />
              </div>
              <button
                className="pp-show"
                type="button"
                aria-expanded={confidence}
                onClick={() => setConfidence((v) => !v)}
              >
                {confidence ? 'Hide the two lowest' : 'What pulls it down'}
              </button>
              {confidence && (
                <div className="ap-conf-low">
                  <p>
                    Lowest of the six: that his current firm gets him the practice he wants, and
                    the share of his time spent on work he enjoys — both 2 of 5.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="pp-card">
            <CardHead icon={icTheMove} title="The Move" />
            <div className="ap-move">
              {(
                [
                  ['The change', d.move.change],
                  ['Timeline', d.move.when],
                  ['Why it’s worth it', d.move.worthIt],
                  ['What’s hard', d.move.challenging],
                  ['Who else has a say', d.move.stakeholders],
                  ['Hardest to bring along', d.move.hardest],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div className="ap-move-row" key={k}>
                  <span className="ap-move-k">{k}</span>
                  <span className="ap-move-v">{v}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

/* ── Tab 2 — Advisor Readiness ───────────────────────────────────────────
   The Knomee Quotient, its three dimensions and the enterprise-only fields a
   retail profile has no equivalent for: route, second seat, book, comp clock. */

function Ring({ value }: { value: number }) {
  // A 100-point dial drawn as a stroked arc: 270° of sweep, plum on a pale
  // wash, so the score reads as a position rather than a colour.
  const r = 62
  const c = 2 * Math.PI * r
  const sweep = 0.75
  return (
    <svg className="ap-ring-svg" viewBox="0 0 160 160" width="160" height="160" aria-hidden>
      <circle
        cx="80"
        cy="80"
        r={r}
        className="ap-ring-track"
        strokeDasharray={`${c * sweep} ${c}`}
        transform="rotate(135 80 80)"
      />
      <circle
        cx="80"
        cy="80"
        r={r}
        className="ap-ring-fill"
        strokeDasharray={`${c * sweep * (value / 100)} ${c}`}
        transform="rotate(135 80 80)"
      />
    </svg>
  )
}

function ReadinessTab() {
  return (
    <>
      <section className="pp-card ap-kq">
        <div className="ap-ring">
          <Ring value={kq} />
          <div className="ap-ring-mid">
            <span className="ap-ring-num">{kq}</span>
            <span className="ap-ring-cap">Knomee Quotient</span>
          </div>
          <span className={`ap-tier ap-tier-${tier.tier}`}>
            Tier {tier.tier} · {tier.name}
          </span>
          <span className="ap-ring-band">
            {tier.min}–{tier.max} band
          </span>
        </div>
        <div className="ap-dims">
          {dimensions.map((dim) => (
            <div className="ap-dim" key={dim.key}>
              <div className="ap-dim-head">
                <span className="ap-dim-key">{dim.key}</span>
                <span className="ap-dim-score">{dim.score}</span>
              </div>
              <div className="ap-dim-track">
                <span className="ap-dim-bar" style={{ width: `${dim.score}%` }} />
              </div>
              <p className="ap-dim-measures">{dim.measures}</p>
              <p className="ap-dim-read">{dim.read}</p>
              <span className="ap-dim-src">{dim.source}</span>
              <ul className="ap-dim-evidence">
                {dim.evidence.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="ap-banner">
        <div className="ap-banner-main">
          <span className="ap-banner-head">{tierBanner.headline}</span>
          <p className="ap-banner-body">{tierBanner.body}</p>
        </div>
        <p className="ap-banner-note">{tierBanner.note}</p>
      </section>

      <div className="ap-cols3">
        <section className="pp-card">
          <CardHead icon={icTheMove} title="How quickly will this advisor move?" />
          <p className="ap-verdict">{velocity.read}</p>
          <p className="ap-body">{velocity.body}</p>
          <div className="ap-reasons">
            {velocity.reasons.map((r) => (
              <div className="ap-reason" key={r.label}>
                <span className="ap-reason-k">{r.label}</span>
                <span className="ap-reason-v">{r.detail}</span>
              </div>
            ))}
          </div>
          <Action>{velocity.action}</Action>
        </section>

        <section className="pp-card">
          <CardHead icon={icPracticeJoy} title="Motivators" />
          <ol className="ap-ranked">
            {motivators.map((m) => (
              <li className={`ap-rank ${m.label === 'Income' ? 'is-low' : ''}`} key={m.label}>
                <span className="ap-rank-n">{m.rank}</span>
                <span className="ap-rank-body">
                  <span className="ap-rank-k">{m.label}</span>
                  <span className="ap-rank-v">{m.detail}</span>
                </span>
              </li>
            ))}
          </ol>
          <Action>{columnActions.motivators}</Action>
        </section>

        <section className="pp-card">
          <CardHead icon={icOutlook} title="Apprehensions" />
          <ol className="ap-ranked">
            {apprehensions.map((a) => (
              <li className="ap-rank" key={a.label}>
                <span className="ap-rank-n">{a.rank}</span>
                <span className="ap-rank-body">
                  <span className="ap-rank-k">{a.label}</span>
                  <span className="ap-rank-v">{a.detail}</span>
                </span>
              </li>
            ))}
          </ol>
          <Action>{columnActions.apprehensions}</Action>
        </section>
      </div>

      <div className="ap-cols2">
        <section className="pp-card">
          <CardHead icon={icTheMove} title="Route" right="One entry point, three destinations" />
          <div className="ap-routes">
            {route.options.map((o) => (
              <div className={`ap-route ${o.matched ? 'is-on' : ''}`} key={o.key}>
                <span className="ap-route-head">
                  <span className="ap-route-name">{o.name}</span>
                  {o.matched && <span className="ap-route-pick">Recommended</span>}
                </span>
                <span className="ap-route-for">{o.forWhom}</span>
                <span className="ap-route-why">{o.why}</span>
              </div>
            ))}
          </div>
          <p className="ap-body">{route.why}</p>
          <Action>{route.action}</Action>
        </section>

        <section className="pp-card">
          <CardHead icon={icQuestions} title="Second seat" right="Who else must be convinced" />
          <div className="ap-seats">
            {secondSeat.seats.map((s) => (
              <div className="ap-seat" key={s.order}>
                <span className="ap-seat-n">{s.order}</span>
                <span className="ap-seat-body">
                  <span className="ap-seat-who">{s.who}</span>
                  <span className="ap-seat-why">{s.why}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="ap-body">{secondSeat.note}</p>
          <Action>{secondSeat.action}</Action>
        </section>

        <section className="pp-card">
          <CardHead icon={icKeyHighlights} title="Book profile" />
          <div className="ap-book">
            {bookProfile.map((b) => (
              <div className="ap-book-row" key={b.label}>
                <span className="ap-book-k">{b.label}</span>
                <span className="ap-book-v">{b.value}</span>
                <span className="ap-book-d">{b.detail}</span>
              </div>
            ))}
          </div>
          <Action>{bookProfileRead}</Action>
        </section>

        <section className="pp-card">
          <CardHead icon={icConfidence} title="The comp clock" right="A date, not a score" />
          <div className="ap-clock">
            {compClock.tranches.map((t) => (
              <div className="ap-tranche" key={t.vests}>
                <span className="ap-tranche-amt">${t.amount}K</span>
                <span className="ap-tranche-date">vests {t.vests}</span>
              </div>
            ))}
          </div>
          <p className="ap-clock-total">{compClock.label} unvested in total</p>
          <p className="ap-body">{compClock.reading}</p>
          <Action>{compClock.action}</Action>
        </section>
      </div>
    </>
  )
}

/* ── Tab 3 — Recruiting Playbook ─────────────────────────────────────────
   Conversation technique, which transfers from the client version almost
   intact. The two panels that get sharper here are the words and the
   questions — an advisor's questions are finite and answerable. */

function PlaybookTab() {
  return (
    <>
      <section className="pp-card ap-top">
        <CardHead icon={icTheMove} title="Top Action" />
        <p className="ap-top-title">{topAction.title}</p>
        <p className="ap-body">{topAction.body}</p>
      </section>

      <div className="pp-cols">
        <div className="pp-col-main">
          <section className="pp-card">
            <CardHead icon={icQuestions} title="Conversation Starters" />
            <div className="ap-starters">
              {starters.map((s) => (
                <div className="ap-starter" key={s.line}>
                  <span className={`ap-tag ap-tag-${s.tag.split(' ')[0].toLowerCase()}`}>
                    {s.tag}
                  </span>
                  <p className="ap-starter-line">“{s.line}”</p>
                  <p className="ap-starter-why">{s.why}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="pp-card">
            <CardHead icon={icKeyHighlights} title="Strategic Recommendations Key" />
            <div className="ap-key">
              {recommendationsKey.map((k) => (
                <div className="ap-key-row" key={k.tag}>
                  <span className={`ap-tag ap-tag-${k.tag.split(' ')[0].toLowerCase()}`}>
                    {k.tag}
                  </span>
                  <span className="ap-key-meaning">{k.meaning}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="pp-card">
            <CardHead icon={icQuestions} title="Questions They May Ask" />
            <div className="ap-asked">
              {questionsTheyAsk.map((q) => (
                <div className="ap-ask" key={q.q}>
                  <p className="ap-ask-q">{q.q}</p>
                  <ul className="ap-ask-points">
                    {q.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="pp-card ap-his">
            <CardHead icon={icQuestions} title="His three questions" right="What the flow told him to ask" />
            <ol className="ap-his-list">
              {hisQuestions.items.map((q, i) => (
                <li key={q}>
                  <span className="ap-his-n">{i + 1}</span>
                  <span className="ap-his-q">{q}</span>
                </li>
              ))}
            </ol>
            <Action>{hisQuestions.note}</Action>
          </section>
        </div>

        {/* Communication rail */}
        <div className="pp-rail">
          <section className="pp-card">
            <CardHead icon={icPracticeJoy} title="Words to Use" />
            <div className="ap-words">
              {words.use.map((w) => (
                <div className="ap-word ap-word-use" key={w.word}>
                  <span className="ap-word-w">{w.word}</span>
                  <span className="ap-word-why">{w.why}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="pp-card">
            <CardHead icon={icOutlook} title="Words to Avoid" />
            <div className="ap-words">
              {words.avoid.map((w) => (
                <div className="ap-word ap-word-avoid" key={w.word}>
                  <span className="ap-word-w">{w.word}</span>
                  <span className="ap-word-why">{w.why}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="pp-card">
            <CardHead icon={icConfidence} title="Verbosity" />
            <p className="ap-verdict">{verbosity.level}</p>
            <p className="ap-meta-line">
              {verbosity.answers} written answers · {verbosity.avgWords} words on average ·
              longest {verbosity.longest}
            </p>
            <p className="ap-body">{verbosity.reading}</p>
          </section>

          <section className="pp-card">
            <CardHead icon={icConfidence} title="Engagement Level" />
            <p className="ap-verdict">{engagementLevel.level}</p>
            <p className="ap-meta-line">{engagementLevel.detail}</p>
            <p className="ap-body">{engagementLevel.reading}</p>
          </section>

          <section className="pp-card ap-takeaway">
            <span className="ap-takeaway-k">Rep takeaway</span>
            <p className="ap-takeaway-v">{repTakeaway}</p>
          </section>
        </div>
      </div>
    </>
  )
}
