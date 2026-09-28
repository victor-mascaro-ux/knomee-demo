/* The Move, on the client's Goals mechanism.
 *
 * The client's fifth adventure writes a goal down, celebrates it, assesses its
 * readiness and lands on a stage of change. The advisor's writes their move
 * down the same way, out of the same parts: the "Hold tight" mark while the
 * moves are lined up, the moves offered as suggested goals with a way to write
 * one's own, the Future You road for when, the readiness panel's tap-to-answer
 * pills for the single choices, the goal panel's pros and cons lists, the
 * confetti and summary when it is added, the readiness questions one tap at a
 * time, and the stage on its sky at the end.
 *
 * It asks more than a client's goal does — why, whether they want support,
 * how they feel about their brand, who else has a say, what is holding the
 * decision — so those are screens of their own between the move and its
 * summary, each with the foot every adventure has.
 *
 * Wording, options and Marcus's samples are read out of `advisorFlow.ts`, and
 * the stage is the Business ID's own rule, so the stage this ending names is
 * the stage the Business ID shows.
 */

import { useEffect, useState, type ReactNode } from 'react'
import './joyFlow.css'
import './joyResults.css'
import './goalsFlow.css'
import './addGoalModal.css'
import './readinessModal.css'
import './futureYouFlow.css'
import './moveFlow.css'
import { steps as flowSteps } from '../data/advisorFlow'
import { emptyAnswers, STAGES, STAGE_BODY, stageOf, type Answers } from '../data/advisorAnswers'
import type { Goal } from '../data/financialId'
import { ArrowGo, PointList, Sparkle } from './AddGoalModal'
import { Road } from './FutureYouFlow'
import { MARK_PARTS } from './ClientExperienceScreen'
import { GoalDetail, TTM_ART } from './profileParts'
import { Reveal } from './JoyResults'

const OTHER = 'Other'
const step = (id: string) => flowSteps.find((s) => s.id === id)
const opts = (id: string) => (step(id)?.options ?? []).filter((o) => o !== OTHER)
const title = (id: string) => step(id)?.title ?? ''
const body = (id: string) => step(id)?.body ?? ''

export interface MoveAnswers {
  move: string | null
  when: string | null
  why: string
  support: string | null
  brand: string | null
  pros: string[]
  cons: string[]
  who: string[]
  blocker: string
  thought: string | null
  knows: string | null
  acting: string | null
}

const EMPTY: MoveAnswers = {
  move: null,
  when: null,
  why: '',
  support: null,
  brand: null,
  pros: [],
  cons: [],
  who: [],
  blocker: '',
  thought: null,
  knows: null,
  acting: null,
}

/* ── the sheet ────────────────────────────────────────────────────────── */

/** The sheet with The Move's answers written onto it. */
export function sheetWithMove(a: Answers, m: MoveAnswers): Answers {
  const choice = { ...a.choice }
  const other = { ...a.other }
  const text = { ...a.text }
  const one = (id: string, v: string | null) => {
    if (!v) {
      delete choice[id]
      return
    }
    if (opts(id).includes(v)) {
      choice[id] = [v]
      other[`${id}:other`] = ''
    } else {
      choice[id] = [OTHER]
      other[`${id}:other`] = v
    }
  }
  const said = (id: string, v: string) => {
    if (v.trim()) text[id] = v.trim()
    else delete text[id]
  }
  one('mv-q1', m.move)
  one('mv-q2', m.when)
  said('mv-q3', m.why)
  one('mv-q4', m.support)
  one('mv-brand', m.brand)
  one('mv-q5', m.thought)
  one('mv-q6', m.knows)
  one('mv-q7', m.acting)
  said('mv-q8', m.pros.map((p) => p.trim()).filter(Boolean).join(', '))
  said('mv-q9', m.cons.map((p) => p.trim()).filter(Boolean).join(', '))
  if (m.who.length) choice['mv-q10'] = m.who
  else delete choice['mv-q10']
  said('mv-q10b', m.blocker)
  return { ...a, choice, other, text }
}

/* ── pieces ───────────────────────────────────────────────────────────── */

const ClockIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6.4" />
    <path d="M8 4.6V8l2.4 1.6" strokeLinecap="round" />
  </svg>
)

function Photo({ src, className, fallback }: { src: string; className?: string; fallback: string }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <span className={fallback} aria-hidden />
  return <img className={className} src={src} alt="" draggable={false} onError={() => setMissing(true)} />
}

/* Confetti for the move written down: the Goals flow's burst. */
const BITS = Array.from({ length: 36 }, (_, i) => ({
  i,
  x: Math.cos((i / 36) * Math.PI * 2) * (70 + ((i * 37) % 90)),
  y: Math.sin((i / 36) * Math.PI * 2) * (50 + ((i * 53) % 70)) - 20,
  c: ['#affc41', '#6bd6c4', '#ff9525', '#f25a7a', '#c77dff', '#ffe066'][i % 6],
  r: (i * 47) % 360,
}))

/* One answer from a list of pills — the readiness panel's, tapped once. The
   pill tapped holds its colour a moment before the next screen comes in, so
   the choice is seen being made. */
function Pills({
  options,
  value,
  onPick,
}: {
  options: string[]
  value: string | null
  onPick: (v: string) => void
}) {
  return (
    <ul className="rm-options mv-pills">
      {options.map((o, i) => (
        <li key={o} style={{ ['--i' as string]: i }}>
          <button
            className={`rm-option${value === o ? ' is-on' : ''}`}
            type="button"
            aria-pressed={value === o}
            onClick={() => onPick(o)}
          >
            {o}
          </button>
        </li>
      ))}
    </ul>
  )
}

type Step =
  | 'intro'
  | 'loading'
  | 'pick'
  | 'when'
  | 'why'
  | 'support'
  | 'brand'
  | 'pros'
  | 'cons'
  | 'who'
  | 'blocker'
  | 'added'
  | 'thought'
  | 'knows'
  | 'acting'
  | 'results'

/* The screens that ask something, in order, with the foot and the meter. */
const QUESTIONS: Step[] = ['pick', 'when', 'why', 'support', 'brand', 'pros', 'cons', 'who', 'blocker']
/* The readiness questions: one tap each, on their own rule, as the client's
   readiness panel asks them. */
const READY: Step[] = ['thought', 'knows', 'acting']
const READY_ID: Record<string, string> = { thought: 'mv-q5', knows: 'mv-q6', acting: 'mv-q7' }

export default function MoveFlow({
  onComplete,
  privateNote,
  mic,
}: {
  onComplete: (m: MoveAnswers) => void
  /** The advisor's privacy switch, for a private question's screen. */
  privateNote?: (stepId: string) => ReactNode
  /** The microphone, under a free-text box. */
  mic?: (value: string, set: (v: string) => void) => ReactNode
}) {
  const [at, setAt] = useState<Step>('intro')
  const [m, setM] = useState<MoveAnswers>(EMPTY)
  const [own, setOwn] = useState('')
  const set = <K extends keyof MoveAnswers>(k: K, v: MoveAnswers[K]) => setM((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    document.querySelector('.cx-viewport')?.scrollTo({ top: 0 })
    if (at === 'loading') {
      const t = window.setTimeout(() => setAt('pick'), 2600)
      return () => window.clearTimeout(t)
    }
  }, [at])

  const qi = QUESTIONS.indexOf(at)
  const ri = READY.indexOf(at)
  const go = (s: Step) => setAt(s)
  const next = () => {
    if (qi >= 0) return go(qi + 1 < QUESTIONS.length ? QUESTIONS[qi + 1] : 'added')
    if (ri >= 0) return go(ri + 1 < READY.length ? READY[ri + 1] : 'results')
  }
  const previous = () => {
    if (qi > 0) return go(QUESTIONS[qi - 1])
    if (qi === 0) return go('intro')
    if (ri > 0) return go(READY[ri - 1])
    if (ri === 0) return go('added')
  }
  /* A pill tapped: it holds its colour for a beat, then the next screen. */
  const pickAndGo = <K extends keyof MoveAnswers>(k: K, v: MoveAnswers[K]) => {
    set(k, v)
    window.setTimeout(next, 260)
  }

  const blank =
    (at === 'pick' && !m.move && !own.trim()) ||
    (at === 'when' && !m.when) ||
    (at === 'why' && !m.why.trim()) ||
    (at === 'support' && !m.support) ||
    (at === 'brand' && !m.brand) ||
    (at === 'pros' && !m.pros.some((p) => p.trim())) ||
    (at === 'cons' && !m.cons.some((p) => p.trim())) ||
    (at === 'who' && !m.who.length) ||
    (at === 'blocker' && !m.blocker.trim())

  const onOk = () => {
    /* A move typed but never sent with its arrow is still the move. */
    if (at === 'pick' && !m.move && own.trim()) set('move', own.trim())
    next()
  }

  /* The move as the Goals flow's summary reads a goal. */
  const goal: Goal = {
    title: m.move ?? 'My move',
    readiness: 0,
    timeline: m.when ?? undefined,
    pros: m.pros.map((p) => p.trim()).filter(Boolean),
    cons: m.cons.map((p) => p.trim()).filter(Boolean),
    note: m.why.trim() || undefined,
    extra: [
      ...(m.who.length ? [{ label: 'Who it involves', value: m.who.join(' · ') }] : []),
      ...(m.support ? [{ label: 'Support', value: m.support }] : []),
    ],
  }

  const stage = stageOf(sheetWithMove(emptyAnswers(), m))
  const level = STAGES.indexOf(stage) + 1

  return (
    <div className="jf gl mv">
      {at === 'intro' && (
        <div className="jf-intro">
          <div className="jf-hero">
            <Photo className="jf-hero-img" src="./goals/intro.png" fallback="gl-hero-fallback" />
          </div>
          <h2 className="jf-title">{title('mv-intro')}</h2>
          <p className="jf-body">{body('mv-intro')}</p>
          <div className="jf-start">
            <button className="jf-go" type="button" onClick={() => go('loading')}>
              Get Started
            </button>
            <span className="jf-min">
              <ClockIcon /> Takes 3 min
            </span>
          </div>
        </div>
      )}

      {/* A moment while the moves are lined up from what they have said: the
          mark turning and pulsing, as the Goals flow has it. */}
      {at === 'loading' && (
        <div className="gl-loading" role="status">
          <svg className="gl-mark" viewBox="0 0 288 288" width="104" height="104" aria-hidden>
            {MARK_PARTS.map((d, i) => (
              <g key={i} className={`gl-mark-spin gl-mark-${i}`}>
                <path d={d} />
              </g>
            ))}
          </svg>
          <h2 className="gl-hold">Hold tight!</h2>
          <p>Lining up the moves that fit what you’ve told us…</p>
        </div>
      )}

      {at === 'pick' && (
        <div className="mv-q">
          <h2 className="fy-h fy-h-sm">{title('mv-q1')}</h2>
          <p className="fy-sub">{body('mv-q1')}</p>
          <ul className="ag-suggestions">
            {opts('mv-q1').map((o) => (
              <li key={o}>
                <button
                  className={`ag-suggestion${m.move === o ? ' is-on' : ''}`}
                  type="button"
                  aria-pressed={m.move === o}
                  onClick={() => {
                    setOwn('')
                    pickAndGo('move', o)
                  }}
                >
                  <span className="ag-spark" aria-hidden>
                    <Sparkle />
                  </span>
                  <span className="ag-suggestion-text">{o}</span>
                  <span className="ag-go" aria-hidden>
                    <ArrowGo />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <h3 className="ag-step-title ag-own-title">Or write your own</h3>
          <div className="ag-own">
            <input
              className="ag-input"
              value={own}
              placeholder="Open a second office"
              onChange={(e) => {
                setOwn(e.target.value)
                if (m.move && !opts('mv-q1').includes(m.move)) set('move', null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && own.trim()) pickAndGo('move', own.trim())
              }}
            />
            <button
              className="ag-go ag-go-btn"
              type="button"
              aria-label="Use this move"
              disabled={!own.trim()}
              onClick={() => pickAndGo('move', own.trim())}
            >
              <ArrowGo />
            </button>
          </div>
        </div>
      )}

      {at === 'when' && (
        <Road
          value={m.when}
          stops={opts('mv-q2')}
          title={title('mv-q2')}
          sub="Pick the stretch of road it sits on."
          onChange={(v) => set('when', v)}
        />
      )}

      {at === 'why' && (
        <div className="mv-q">
          <h2 className="fy-h fy-h-sm">{title('mv-q3')}</h2>
          <p className="fy-sub">{body('mv-q3')}</p>
          <textarea
            className="jf-note"
            rows={5}
            value={m.why}
            placeholder="Write it, or tap the mic and say it."
            onChange={(e) => set('why', e.target.value)}
          />
          {mic?.(m.why, (v) => set('why', v))}
        </div>
      )}

      {at === 'support' && (
        <div className="mv-q">
          <h2 className="fy-h fy-h-sm">{title('mv-q4')}</h2>
          <Pills options={opts('mv-q4')} value={m.support} onPick={(v) => pickAndGo('support', v)} />
        </div>
      )}

      {at === 'brand' && (
        <div className="mv-q">
          <h2 className="fy-h fy-h-sm">{title('mv-brand')}</h2>
          <p className="fy-sub">{body('mv-brand')}</p>
          {privateNote?.('mv-brand')}
          <Pills options={opts('mv-brand')} value={m.brand} onPick={(v) => pickAndGo('brand', v)} />
        </div>
      )}

      {(at === 'pros' || at === 'cons') && (
        <div className="mv-q">
          <h2 className="fy-h fy-h-sm">{title(at === 'pros' ? 'mv-q8' : 'mv-q9')}</h2>
          <p className="fy-sub">{at === 'pros' ? 'One at a time — add as many as you like.' : 'The obstacles, one at a time.'}</p>
          <PointList
            key={at}
            label={at === 'pros' ? 'Pros' : 'Cons'}
            hint={at === 'pros' ? 'Add a reason it’s worth it.' : 'Add something that could get in the way.'}
            items={at === 'pros' ? m.pros : m.cons}
            onChange={(v) => set(at, v)}
          />
        </div>
      )}

      {at === 'who' && (
        <div className="mv-q">
          <h2 className="fy-h fy-h-sm">{title('mv-q10')}</h2>
          <p className="fy-sub">{body('mv-q10')}</p>
          <div className="fy-chips mv-chips">
            {opts('mv-q10').map((o) => (
              <button
                key={o}
                type="button"
                className={`fy-chip${m.who.includes(o) ? ' is-on' : ''}`}
                aria-pressed={m.who.includes(o)}
                onClick={() => set('who', m.who.includes(o) ? m.who.filter((x) => x !== o) : [...m.who, o])}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {at === 'blocker' && (
        <div className="mv-q">
          <h2 className="fy-h fy-h-sm">{title('mv-q10b')}</h2>
          <p className="fy-sub">{body('mv-q10b')}</p>
          {privateNote?.('mv-q10b')}
          <textarea
            className="jf-note"
            rows={5}
            value={m.blocker}
            placeholder="Write it, or tap the mic and say it."
            onChange={(e) => set('blocker', e.target.value)}
          />
          {mic?.(m.blocker, (v) => set('blocker', v))}
        </div>
      )}

      {/* The move written down: the Goals flow's confetti and summary. */}
      {at === 'added' && (
        <div className="gl-added">
          <div className="gl-burst" aria-hidden>
            {BITS.map((b) => (
              <i
                key={b.i}
                style={{
                  ['--x' as string]: `${b.x}px`,
                  ['--y' as string]: `${b.y}px`,
                  ['--r' as string]: `${b.r}deg`,
                  background: b.c,
                  animationDelay: `${(b.i % 6) * 0.03}s`,
                }}
              />
            ))}
          </div>
          <span className="gl-check" aria-hidden>
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
              <path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h2 className="gl-title">Your move is written down!</h2>
          <div className="gl-summary">
            <span className="gl-summary-head">Your move</span>
            <b className="gl-summary-title">{goal.title}</b>
            <GoalDetail g={goal} />
          </div>
          <div className="gl-acts">
            <button className="jf-go" type="button" onClick={() => go('thought')}>
              Assess My Readiness
            </button>
            <button className="gl-link" type="button" onClick={() => go('blocker')}>
              Back
            </button>
          </div>
        </div>
      )}

      {/* The readiness questions, the client's panel in the page: one rule
          for how far through, the move's name, the question and its pills. */}
      {ri >= 0 && (
        <div className="mv-ready" key={at}>
          <span className="rm-rule" aria-hidden>
            <i style={{ width: `${(ri / READY.length) * 100}%` }} />
          </span>
          <p className="rm-goal">{goal.title}</p>
          <p className="rm-ask">{title(READY_ID[at])}</p>
          <Pills
            options={opts(READY_ID[at])}
            value={m[at as 'thought' | 'knows' | 'acting']}
            onPick={(v) => pickAndGo(at as 'thought' | 'knows' | 'acting', v)}
          />
          <button className="rm-back" type="button" onClick={previous}>
            Back
          </button>
        </div>
      )}

      {at === 'results' && (
        <div className="jr glr">
          <Reveal>
            <h2 className="jr-title">Your readiness</h2>
            <p className="jr-sub">{goal.title}</p>
            {/* The stage as the picture: the readiness art on a living sky, and
                the stage's name — the Goals flow's ending. */}
            <figure className="jr-memory glr-hero">
              <span className="jr-sky glr-sky" aria-hidden>
                <i className="jr-sun" />
                <i className="jr-glow jr-glow-a" />
                <i className="jr-glow jr-glow-b" />
                <i className="jr-glow jr-glow-c" />
              </span>
              <span className="glr-kicker">My readiness stage for my move is</span>
              <div className="glr-stage">
                <img className="glr-ttm" src={TTM_ART[Math.max(1, level) - 1]} alt="" draggable={false} />
                <b>{stage.toUpperCase()}</b>
              </div>
              <p className="glr-line">{STAGE_BODY[stage]}</p>
            </figure>
          </Reveal>

          <Reveal>
            <h3 className="jr-h">Your move</h3>
            <div className="glr-summaries">
              <div className="gl-summary glr-summary">
                <b className="gl-summary-title">{goal.title}</b>
                <GoalDetail g={{ ...goal, readiness: level }} />
              </div>
            </div>
          </Reveal>

          <Reveal className="jr-reward">
            <button className="jr-claim" type="button" onClick={() => onComplete(m)}>
              <span>Continue</span>
            </button>
          </Reveal>
        </div>
      )}

      {qi >= 0 && (
        <>
          {/* Where you are, at the top under the bar — the foot is only
              Back and the one thing to press. */}
          <div className="jf-top">
            <div className="af-progress" aria-hidden>
              {QUESTIONS.map((s, i) => (
                <i key={s} className={i <= qi ? 'is-on' : ''} />
              ))}
            </div>
          </div>
          <div className="jf-foot">
            <div className="jf-where">
              <button className="jf-prev" type="button" onClick={previous}>
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden>
                  <path
                    d="M10 3.5 5.5 8 10 12.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Previous question
              </button>
            </div>
            <button className={`cx-start jf-ok${blank ? ' is-skip' : ''}`} type="button" onClick={onOk}>
              {blank ? 'Skip this question' : 'OK'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
