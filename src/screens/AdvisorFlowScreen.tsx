// The advisor-as-prospect flow: welcome → the five adventures → Independence ID.
//
// Same device, same chrome, same tab bar as ClientExperienceScreen — the phone
// frame and the fit/zoom hooks are imported from it rather than copied, so the
// two mobile demos cannot drift apart. Only the content differs: the person
// answering is a breakaway advisor, and the artefact at the end is the
// Independence ID rather than the Financial ID.
//
// Every answer is pre-filled from `data/advisorFlow` so the flow can be clicked
// through as a walkthrough. Nothing here is a real advisor.

import { useMemo, useRef, useState } from 'react'
import { useDragScroll } from './mobileGestures'
import {
  ActionRow,
  ArrowRight,
  CheckIcon,
  ClockIcon,
  CompletedRow,
  DEVICE_H,
  DEVICE_W,
  IPhone,
  LockedRow,
  ProgressMeter,
  TabAdventures,
  TabFinId,
  ZOOM_CONTROLS_TITLE,
  clampZoom,
  useDarkGround,
  useFitToWindow,
  useZoom,
} from './ClientExperienceScreen'
import {
  advisor,
  advisorAdventures,
  advisorProgress,
  conversionSnapshot,
  independenceId,
  steps,
  type AdventureId,
  type Step,
} from '../data/advisorFlow'
import knomeeMark from '../assets/knomee-mark.svg'
import './client-experience.css'
import './advisor-flow.css'

const ZOOM_STEP = 0.1
const TAB_EDGE = 'M0 18H154a55.7 55.7 0 0 1 82 0h154'

/* ── small pieces ── */

function Eyebrow({ text }: { text?: string }) {
  if (!text) return null
  return <div className="af-eyebrow">{text}</div>
}

function Paras({ text }: { text?: string }) {
  if (!text) return null
  return (
    <>
      {text.split('\n\n').map((p, i) => (
        <p key={i} className="af-body">
          {p}
        </p>
      ))}
    </>
  )
}

function Scale({ low, high, value }: { low: string; high: string; value: number }) {
  return (
    <div className="af-scale">
      <div className="af-scale-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`af-dot ${n === value ? 'is-on' : ''}`}>
            {n}
          </span>
        ))}
      </div>
      <div className="af-scale-ends">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

/* ── the step renderer ── */

function StepBody({
  step,
  onHome,
  onAdventure,
}: {
  step: Step
  onHome: () => void
  onAdventure: (id: AdventureId) => void
}) {
  switch (step.kind) {
    case 'welcome':
      return (
        <div className="af-welcome">
          <h2 className="af-h1">{step.title}</h2>
          <Paras text={step.body} />
          <div className="af-getlist-title">What you’ll get</div>
          <ol className="af-getlist">
            {step.lines?.map((l) => (
              <li key={l.label}>
                <span className="af-getnum">{l.label}</span>
                <span>{l.value}</span>
              </li>
            ))}
          </ol>
          <div className="af-est">
            <ClockIcon />
            {step.stat}
          </div>
        </div>
      )

    case 'home':
      return (
        <>
          <ProgressMeter done={advisorProgress.done} required={advisorProgress.required} />
          <h2 className="cx-screen-title">My Adventures</h2>
          <div className="cx-adv-list">
            {advisorAdventures.map((a) => {
              // Every row opens its adventure — this is a walkthrough, so the
              // state a row wears is a look, not a gate.
              const open = () => onAdventure(a.id)
              if (a.state === 'done') {
                return (
                  <CompletedRow
                    key={a.id}
                    title={a.title}
                    artKey={a.art}
                    on={advisor.completedOn}
                    onRow={open}
                  />
                )
              }
              if (a.state === 'open') {
                return (
                  <ActionRow
                    key={a.id}
                    a={{
                      title: a.title,
                      art: a.art,
                      blurb: a.blurb,
                      minutes: a.minutes,
                      label: 'Start',
                    }}
                    onAct={open}
                    onRow={open}
                  />
                )
              }
              return <LockedRow key={a.id} title={a.title} artKey={a.art} onRow={open} />
            })}
          </div>
        </>
      )

    case 'intro':
      return (
        <div className="af-intro">
          <Eyebrow text={step.eyebrow} />
          <h2 className="af-h1">{step.title}</h2>
          <Paras text={step.body} />
          {step.cite && <div className="af-cite">{step.cite}</div>}
        </div>
      )

    case 'reflect':
      return (
        <div className="af-reflect">
          <h2 className="af-h2">{step.title}</h2>
          <Paras text={step.body} />
        </div>
      )

    case 'multi':
    case 'single':
      return (
        <div className="af-q">
          <Eyebrow text={step.eyebrow} />
          <h2 className="af-h2">{step.title}</h2>
          <Paras text={step.body} />
          <div className="af-opts">
            {step.options?.map((o) => {
              const on = step.chosen?.includes(o)
              return (
                <span key={o} className={`af-opt ${on ? 'is-on' : ''}`}>
                  <span className={`af-box ${step.kind === 'single' ? 'is-round' : ''}`}>
                    {on && <CheckIcon size={11} />}
                  </span>
                  {o}
                </span>
              )
            })}
          </div>
        </div>
      )

    case 'grid':
      return (
        <div className="af-q">
          <Eyebrow text={step.eyebrow} />
          <h2 className="af-h2">{step.title}</h2>
          <div className="af-grid">
            <div className="af-grid-head">
              <span>Area</span>
              <span>+ More</span>
              <span>= Same</span>
              <span>− Less</span>
            </div>
            {step.rows?.map((r) => (
              <div className="af-grid-row" key={r.label}>
                <span className="af-grid-label">{r.label}</span>
                {(['More', 'Same', 'Less'] as const).map((v) => (
                  <span key={v} className={`af-radio ${r.value === v ? 'is-on' : ''}`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )

    case 'text':
      return (
        <div className="af-q">
          <Eyebrow text={step.eyebrow} />
          <h2 className="af-h2">{step.title}</h2>
          <Paras text={step.body} />
          <div className="af-answer">{step.answer}</div>
          {step.hints && (
            <div className="af-hints">
              <div className="af-hints-title">Here are some prompts to help you start</div>
              {step.hints.map((h) => (
                <div key={h} className="af-hint">
                  {h}
                </div>
              ))}
            </div>
          )}
        </div>
      )

    case 'scale':
      return (
        <div className="af-q">
          <Eyebrow text={step.eyebrow} />
          <h2 className="af-h2">{step.title}</h2>
          {step.scale && <Scale {...step.scale} />}
        </div>
      )

    case 'scaleSet':
      return (
        <div className="af-q">
          <Eyebrow text={step.eyebrow} />
          <h2 className="af-h2">{step.title}</h2>
          <div className="af-stmts">
            {step.statements?.map((s, i) => (
              <div className="af-stmt" key={s.text}>
                <div className="af-stmt-text">
                  <span className="af-stmt-n">{i + 1}</span>
                  {s.text}
                </div>
                <Scale low={s.low} high={s.high} value={s.value} />
              </div>
            ))}
          </div>
        </div>
      )

    case 'unlock':
    case 'stage':
      return (
        <div className={`af-unlock ${step.kind === 'stage' ? 'is-stage' : ''}`}>
          {step.kind === 'stage' && <div className="af-eyebrow">My readiness stage is</div>}
          <h2 className="af-h1">{step.title}</h2>
          <Paras text={step.body} />
          <div className="af-lines">
            {step.lines?.map((l) => (
              <div className="af-line" key={l.label}>
                <span className="af-line-k">{l.label}</span>
                <span className="af-line-v">{l.value}</span>
              </div>
            ))}
          </div>
          {step.stat && <div className="af-stat">{step.stat}</div>}
        </div>
      )

    case 'summary':
      return (
        <div className="af-unlock">
          <h2 className="af-h1">Congratulations</h2>
          <p className="af-body">You’re taking a meaningful step. Here’s your personalized summary.</p>
          <div className="af-lines">
            {independenceId.highlights.map((h) => (
              <div className="af-line" key={h.title}>
                <span className="af-line-k">{h.title}</span>
                <span className="af-line-v">{h.text}</span>
              </div>
            ))}
            <div className="af-line">
              <span className="af-line-k">Readiness stage</span>
              <span className="af-line-v">
                {independenceId.readiness.stage} · confidence {independenceId.readiness.confidence.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      )

    case 'questions':
      return (
        <div className="af-unlock">
          <h2 className="af-h1">Your three questions</h2>
          <p className="af-body">
            Put these to every platform you’re considering. Including this one.
          </p>
          <ol className="af-qs">
            {independenceId.questions.map((q, i) => (
              <li key={q}>
                <span className="af-getnum">{i + 1}</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
          <button className="cx-start af-wide" type="button" onClick={onHome}>
            View my Independence ID
          </button>
          <div className="af-stat">If you’d like to talk it through with Dynasty, book a time.</div>
        </div>
      )

    default:
      return null
  }
}

/* ── the Independence ID tab ── */

function IndependenceIdScreen() {
  const d = independenceId
  return (
    <div className="af-id">
      <div className="af-id-head">
        <span className="af-id-avatar">{advisor.initial}</span>
        <div>
          <div className="af-id-name">{d.header.name}</div>
          <div className="af-id-meta">{d.header.meta}</div>
        </div>
      </div>
      <div className="af-id-privacy">{d.header.privacy}</div>

      <div className="af-id-badges">
        {d.badges.map((b) => (
          <span key={b} className="af-badge">
            <CheckIcon size={10} />
            {b}
          </span>
        ))}
      </div>

      <div className="af-id-readiness">
        <div>
          <span className="af-id-k">Readiness</span>
          <span className="af-id-stage">{d.readiness.stage}</span>
        </div>
        <div>
          <span className="af-id-k">Confidence</span>
          <span className="af-id-stage">{d.readiness.confidence}</span>
        </div>
        <p>{d.readiness.note}</p>
      </div>

      <h3 className="af-id-h">Key highlights</h3>
      <div className="af-lines">
        {d.highlights.map((h) => (
          <div className="af-line" key={h.title}>
            <span className="af-line-k">{h.title}</span>
            <span className="af-line-v">{h.text}</span>
          </div>
        ))}
      </div>

      <h3 className="af-id-h">{d.practiceJoy.prompt}</h3>
      <div className="af-chips">
        {d.practiceJoy.chips.map((c) => (
          <span key={c} className="af-chip">
            {c}
          </span>
        ))}
      </div>

      <h3 className="af-id-h">Attention</h3>
      <div className="af-two">
        <div>
          <span className="af-id-k">More</span>
          {d.attention.more.map((m) => (
            <div key={m} className="af-mini">
              {m}
            </div>
          ))}
        </div>
        <div>
          <span className="af-id-k">Less</span>
          {d.attention.less.map((m) => (
            <div key={m} className="af-mini">
              {m}
            </div>
          ))}
        </div>
      </div>

      <h3 className="af-id-h">Future You</h3>
      <div className="af-lines">
        <div className="af-line">
          <span className="af-line-k">Where</span>
          <span className="af-line-v">{d.futureYou.where.join(', ')}</span>
        </div>
        <div className="af-line">
          <span className="af-line-k">What</span>
          <span className="af-line-v">{d.futureYou.what.join(', ')}</span>
        </div>
        <div className="af-line">
          <span className="af-line-k">Who</span>
          <span className="af-line-v">{d.futureYou.who.join(', ')}</span>
        </div>
      </div>

      <h3 className="af-id-h">Outlook</h3>
      <span className="af-id-k">Concerns</span>
      {d.outlook.concerns.map((c) => (
        <div key={c} className="af-quote">
          {c}
        </div>
      ))}
      <span className="af-id-k">Hopes</span>
      {d.outlook.hopes.map((c) => (
        <div key={c} className="af-quote">
          {c}
        </div>
      ))}

      <h3 className="af-id-h">The Move</h3>
      <div className="af-lines">
        <div className="af-line">
          <span className="af-line-k">Change</span>
          <span className="af-line-v">
            {d.move.change} · {d.move.when}
          </span>
        </div>
        <div className="af-line">
          <span className="af-line-k">Worth it because</span>
          <span className="af-line-v">{d.move.worthIt}</span>
        </div>
        <div className="af-line">
          <span className="af-line-k">Challenging because</span>
          <span className="af-line-v">{d.move.challenging}</span>
        </div>
        <div className="af-line">
          <span className="af-line-k">Others with a say</span>
          <span className="af-line-v">
            {d.move.stakeholders} — hardest: {d.move.hardest}
          </span>
        </div>
      </div>

      <h3 className="af-id-h">My three questions</h3>
      <ol className="af-qs">
        {d.questions.map((q, i) => (
          <li key={q}>
            <span className="af-getnum">{i + 1}</span>
            <span>{q}</span>
          </li>
        ))}
      </ol>

      <h3 className="af-id-h">What the platform sees</h3>
      <div className="af-snapshot">
        {conversionSnapshot.map((r) => (
          <div className="af-snap-row" key={r.k}>
            <span>{r.k}</span>
            <span>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── the screen ── */

export default function AdvisorFlowScreen({ onExit }: { onExit: () => void }) {
  // Where you have been, not just where you are: tapping a row on the
  // adventures list jumps across the flow, and Back has to mean "the screen I
  // came from" rather than "the step before this one" — otherwise Back out of
  // The Move would land in the middle of Future You.
  const [trail, setTrail] = useState<number[]>([0])
  const i = trail[trail.length - 1]
  const [tab, setTab] = useState<'flow' | 'finid'>('flow')
  const [menuOpen, setMenuOpen] = useState(false)
  const viewport = useRef<HTMLDivElement>(null)
  useDragScroll(viewport)
  useDarkGround()
  const { scale: fitScale, windowH } = useFitToWindow()
  const { zoom, setZoom, reset: resetZoom } = useZoom()
  const scale = fitScale * zoom

  const step = steps[i]
  const last = i === steps.length - 1
  // Inside an adventure the bottom bar is Back and OK; on the two destinations
  // — the adventures list and the Independence ID — it is the tab bar. The
  // welcome screen counts as in-flow: its "Get started" is the same button.
  const inFlow = tab === 'flow' && step.kind !== 'home'
  const cta = useMemo(() => {
    if (step.cta) return step.cta
    if (step.kind === 'unlock' || step.kind === 'stage') return 'Submit'
    if (step.kind === 'summary') return 'Continue'
    return 'OK'
  }, [step])

  // Scroll back to the top of the phone on every step change; a long question
  // followed by a short one would otherwise open half-way down.
  const toTop = () => viewport.current?.scrollTo({ top: 0 })
  const go = (n: number) => {
    setTrail((t) => [...t, n])
    toTop()
  }
  const back = () => {
    setTrail((t) => (t.length > 1 ? t.slice(0, -1) : t))
    toTop()
  }

  // Tapping a row on the adventures list drops you at that adventure's intro.
  const openAdventure = (id: AdventureId) => {
    const at = steps.findIndex((s) => s.adventure === id)
    if (at >= 0) go(at)
  }

  return (
    <div className="cx-page" style={windowH ? { minHeight: windowH } : undefined}>
      <div className="cx-fit" style={{ height: DEVICE_H * scale, width: DEVICE_W * scale }}>
        <IPhone scale={scale}>
          <header className="cx-appbar">
            <div className="cx-appbar-brand">
              <img src="./knomee-logo-white.svg" alt="knomee" />
            </div>
            <button
              className="cx-appbar-burger"
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg viewBox="0 0 22 22" width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.9">
                <path d="M3 6h16M3 11h16M3 16h16" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div className="cx-viewport" ref={viewport}>
            {tab === 'finid' ? (
              <IndependenceIdScreen />
            ) : (
              <>
                <StepBody
                  step={step}
                  onHome={() => setTab('finid')}
                  onAdventure={openAdventure}
                />
              </>
            )}
          </div>

          {/* Inside an adventure the phone's bottom bar IS Back and OK — they
              take the tab bar's place rather than stacking above it, so they
              are always on screen however long the question runs. The tab bar
              comes back on the two destinations: the adventures list and the
              Independence ID. */}
          {inFlow ? (
            <div className="af-foot">
              <div className="af-nav">
                {trail.length > 1 && (
                  <button className="af-back" type="button" onClick={back}>
                    Back
                  </button>
                )}
                {!last && (
                  <button className="cx-start af-next" type="button" onClick={() => go(i + 1)}>
                    {cta}
                  </button>
                )}
              </div>
              <div className="af-progress" aria-hidden>
                {steps.map((s, n) => (
                  <i key={s.id} className={n <= i ? 'is-on' : ''} />
                ))}
              </div>
            </div>
          ) : (
          <nav className="cx-tabbar">
            <svg className="cx-tab-edge" viewBox="0 0 390 96" width="390" height="96" aria-hidden>
              <path d={`${TAB_EDGE}V96H0Z`} fill="#fff" />
              <path d={TAB_EDGE} fill="none" stroke="#e6e5ea" strokeWidth="1.2" />
            </svg>
            <button
              type="button"
              className={`cx-tab ${tab === 'flow' ? 'is-on' : ''}`}
              onClick={() => setTab('flow')}
            >
              <TabAdventures />
              <span className="cx-tab-lbl">Adventures</span>
            </button>
            <button type="button" className="cx-tab cx-tab-center" aria-label="Knomee">
              <img className="cx-tab-mark" src={knomeeMark} alt="knomee" />
            </button>
            <button
              type="button"
              className={`cx-tab ${tab === 'finid' ? 'is-on' : ''}`}
              onClick={() => setTab('finid')}
            >
              <TabFinId />
              <span className="cx-tab-lbl">Independence ID</span>
            </button>
          </nav>
          )}

          <div className="cx-home-bar" />

          {menuOpen && (
            <div className="cx-sheet" onClick={() => setMenuOpen(false)}>
              <div className="cx-sheet-panel" onClick={(e) => e.stopPropagation()}>
                <div className="cx-sheet-account">
                  <span className="cx-sheet-avatar">{advisor.initial}</span>
                  <span>
                    <b>{advisor.name}</b>
                    <i>{advisor.role}</i>
                  </span>
                </div>
                <button className="cx-sheet-item" type="button" onClick={() => go(0)}>
                  Restart the flow
                  <ArrowRight />
                </button>
                <button className="cx-sheet-item" type="button" onClick={onExit}>
                  Advisor Experience
                  <ArrowRight />
                </button>
                <div className="cx-sheet-hint">Switches back to the adviser demo.</div>
              </div>
            </div>
          )}
        </IPhone>
      </div>

      <div className="cx-view" role="group" aria-label="View">
        {zoom !== 1 && (
          <span className="cx-zoom">
            <button type="button" onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))} aria-label="Zoom out">
              &minus;
            </button>
            <span className="cx-zoom-pct">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))} aria-label="Zoom in">
              +
            </button>
          </span>
        )}
        <button type="button" className="cx-fit-btn" onClick={resetZoom} title={ZOOM_CONTROLS_TITLE}>
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              d="M2 6V2.6h3.4M14 6V2.6h-3.4M2 10v3.4h3.4M14 10v3.4h-3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Fit to screen
        </button>
      </div>
    </div>
  )
}
