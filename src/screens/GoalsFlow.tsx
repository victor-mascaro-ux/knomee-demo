/* Goals, taken on the phone.
 *
 * The fifth adventure, and the flow the page already has: the same Add a Goal
 * panel and the same readiness questions the Financial ID opens, walked
 * through in order. First a moment while the goals are "generated" from what
 * the other adventures said; then choosing one, or writing one, and its
 * detail; then "Goal Added Successfully!" with the goal's summary; then its
 * readiness, which lands on a stage of change; then the badge — the fifth.
 */

import { useEffect, useState, type ReactNode } from 'react'
import './joyFlow.css'
import './joyResults.css'
import './goalsFlow.css'
import { financialId, type Goal } from '../data/financialId'
import AddGoalModal from './AddGoalModal'
import ReadinessModal from './ReadinessModal'
import JoyReward from './JoyReward'
import { Reveal } from './JoyResults'
import { MARK_PARTS } from './ClientExperienceScreen'
import MoveFlow, { type MoveAnswers, type MoveContent } from './MoveFlow'
import { QUESTIONS as READINESS, stageOf as readinessStageOf } from './ReadinessModal'
import { GoalDetail, TTM_ART, TTM_STAGES } from './profileParts'
import bgGoals from '../assets/badges/goals-on-plum.svg'
import { AdventureBadge } from './AdventureMark'

export interface GoalsAnswers {
  goals: Goal[]
}

/* What each stage means for her, in a line — the ending's reading. */
const STAGE_LINE = [
  'You may not be thinking about change yet — and that is okay. Awareness starts with simply knowing where you are today.',
  'You are not ready to act just yet, and that is completely normal. Naming it is a powerful first step.',
  'You are building awareness and laying the groundwork for change. Knowing where you stand is the first step toward progress.',
  'You are making meaningful changes toward your goal. Stay focused and keep up the momentum!',
  'Keeping this stage is a major accomplishment. Stay consistent, and you will keep building on your success.',
]

/* What a goal saved bare is filled in with, the house rule for a question left
   unanswered: a sample fitting the goal, so a demo never lands on an empty
   summary. Keyed by the suggested goals; anything she wrote herself gets the
   last. */
const SAMPLE_DETAIL: Record<string, Pick<Goal, 'pros' | 'cons' | 'note'>> = {
  'Plan a family beach vacation': {
    pros: ['Quality time with family', 'Rest and adventure'],
    cons: ['High cost', 'Scheduling around school'],
    note: 'I want the kids to remember a summer we spent together.',
  },
  'Spend more time with my mom as she goes through treatments': {
    pros: ['Being there when it matters', 'Peace of mind'],
    cons: ['Less time at work', 'Travel costs'],
    note: 'I want to be with her for every appointment I can.',
  },
  'Contribute more to cancer-related philanthropy': {
    pros: ['Giving back', 'A cause close to home'],
    cons: ['Less to save each month'],
    note: 'I want our giving to mean something to our family.',
  },
}
const SAMPLE_OWN: Pick<Goal, 'pros' | 'cons' | 'note'> = {
  pros: ['Something to work toward', 'Peace of mind'],
  cons: ['Takes time and money'],
  note: 'This matters to me and to the people I love.',
}

const StageArt = ({ level }: { level: number }) => (
  <img className="glr-ttm" src={TTM_ART[Math.max(1, level) - 1]} alt="" draggable={false} />
)

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

/* Confetti for the goal added: a light burst of the brand's colours. */
const BITS = Array.from({ length: 36 }, (_, i) => ({
  i,
  x: Math.cos((i / 36) * Math.PI * 2) * (70 + ((i * 37) % 90)),
  y: Math.sin((i / 36) * Math.PI * 2) * (50 + ((i * 53) % 70)) - 20,
  c: ['#affc41', '#6bd6c4', '#ff9525', '#f25a7a', '#c77dff', '#ffe066'][i % 6],
  r: (i * 47) % 360,
}))

type Step = 'intro' | 'loading' | 'add' | 'added' | 'readiness' | 'results' | 'badge'

/* ── the client's words for the one flow ──────────────────────────────────
   Goals is The Move's flow in her words: a goal to work toward, when, why,
   whether she wants her advisor in it (pictured), what lifts it and what
   weighs it down, then the three readiness questions the Financial ID's panel
   asks. The stage comes out the way that panel works it out. */
const [, THOUGHT, KNOWS, ACTING] = READINESS
const answerOf = (q: typeof THOUGHT, label: string | null) => q.options.find((o) => o.label === label) ?? null
export const CLIENT_GOALS: MoveContent = {
  word: 'goal',
  intro: {
    title: 'Welcome to Your Goals Adventure!',
    body: 'Let’s turn your aspirations into action by setting a meaningful long-term goal.',
    minutes: 3,
  },
  loading: 'Generating recommended Goals just for you…',
  pick: {
    title: 'What goal would you like to work on?',
    sub: 'We lined these up from what you’ve shared. Pick one, or write your own.',
    options: financialId.suggestedGoals,
    ownPlaceholder: 'Buy a lake house',
  },
  /* Five stops, as every road in the app has: the goal panel's seven
     horizons would not fit their words along it. */
  when: {
    title: 'When would you like to reach it?',
    sub: 'Pick the stretch of road it sits on.',
    stops: ['Under 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'],
  },
  why: {
    title: 'Why do you want this?',
    sub: 'In your own words — this is what your advisor reads first.',
    ghosts: [
      'I want the kids to remember a summer we spent together…',
      'I want to be there for her, every appointment I can…',
      'I want our giving to mean something to our family…',
    ],
    starters: ['I want to…', 'It matters because…', 'For my family…', 'I’ve always wanted…'],
    cheer: 'That’s the heart of it ✦',
  },
  support: {
    title: 'How do you want to reach your goal?',
    options: READINESS[0].options.map((o) => o.label),
    pictures: ['./advisor/move/on-my-own.png', './advisor/future-you/clients-i-chose.jpg'],
    labels: { 'I want to do it on my own': 'On my own', 'I want help from my advisor': 'With my advisor' },
  },
  pros: {
    title: 'What makes it worth it?',
    sub: 'Every reason is a balloon — add them and watch your goal lift.',
    placeholder: 'A reason it’s worth it…',
    ghosts: ['Quality time with my family…', 'Peace of mind…', 'Something to look forward to…'],
    starters: ['It would let me…', 'My family would…', 'I’d finally…', 'It would feel…'],
  },
  cons: {
    title: 'What could get in the way?',
    sub: 'Every obstacle is a sandbag. Name them — that’s how you drop them later.',
    placeholder: 'Something that could get in the way…',
    ghosts: ['The cost of it…', 'Finding the time around work…', 'Less to save each month…'],
    starters: ['It would cost…', 'I’m worried about…', 'It’s hard to…', 'I’d have to give up…'],
  },
  questions: ['pick', 'when', 'why', 'support', 'pros', 'cons'],
  /* Four of each: the balloon names four, and a goal reads best on a few. */
  listMax: 4,
  added: 'Goal Added Successfully!',
  ready: {
    thought: { title: `${THOUGHT.lead}${THOUGHT.strong}${THOUGHT.tail}`, options: THOUGHT.options.map((o) => o.label) },
    knows: { title: `${KNOWS.lead}${KNOWS.strong}${KNOWS.tail}`, options: KNOWS.options.map((o) => o.label) },
    acting: { title: `${ACTING.lead}${ACTING.strong}${ACTING.tail}`, options: ACTING.options.map((o) => o.label) },
  },
  reading: (m) => {
    const level = readinessStageOf([null, answerOf(THOUGHT, m.thought), answerOf(KNOWS, m.knows), answerOf(ACTING, m.acting)])
    return { level, name: TTM_STAGES[level - 1], line: STAGE_LINE[level - 1] }
  },
  results: { title: 'Goal Readiness', kicker: 'My readiness stage for my goal is' },
  badge: { art: bgGoals, name: 'Goals' },
}

/* Her answers as the goal the Financial ID keeps: dated today, at the stage
   the readiness questions put it on — and, left bare, filled with the sample
   that fits it, so a demo never lands on an empty summary. */
export function goalFrom(m: MoveAnswers): Goal {
  const d = new Date()
  const p2 = (n: number) => String(n).padStart(2, '0')
  const title = m.move ?? 'My goal'
  const pros = m.pros.map((p) => p.trim()).filter(Boolean)
  const cons = m.cons.map((p) => p.trim()).filter(Boolean)
  const note = m.why.trim() || undefined
  const bare = !pros.length && !cons.length && !note
  const sample = SAMPLE_DETAIL[title] ?? SAMPLE_OWN
  return {
    title,
    readiness: CLIENT_GOALS.reading(m).level,
    updated: `${p2(d.getMonth() + 1)}/${p2(d.getDate())}/${d.getFullYear()}`,
    timeline: m.when ?? undefined,
    ...(bare ? sample : { pros, cons, note }),
    extra: m.support ? [{ label: 'Support', value: m.support }] : [],
  }
}

type GoalsReward = { before: number; after: number; total: number; next: string; card?: ReactNode; idName?: string }

export default function GoalsFlow({
  reward,
  onComplete,
  review,
  mic,
}: {
  /** The microphone, under a free-text box. */
  mic?: (value: string, set: (v: string) => void) => ReactNode
  reward: GoalsReward | ((a: GoalsAnswers) => GoalsReward)
  onComplete: (a: GoalsAnswers) => void
  review?: GoalsAnswers
}) {
  /* Taken: The Move's flow, in her words. Looked back at: the ending as it
     was, below. */
  if (!review)
    return (
      <MoveFlow
        content={CLIENT_GOALS}
        mic={mic}
        reward={(m) => {
          const a = { goals: [goalFrom(m)] }
          return typeof reward === 'function' ? reward(a) : reward
        }}
        onComplete={(m) => onComplete({ goals: [goalFrom(m)] })}
      />
    )
  return <GoalsReview reward={reward} onComplete={onComplete} review={review} />
}

function GoalsReview({
  reward,
  onComplete,
  review,
}: {
  reward: { before: number; after: number; total: number; next: string; card?: ReactNode; idName?: string } | ((a: GoalsAnswers) => { before: number; after: number; total: number; next: string; card?: ReactNode; idName?: string })
  onComplete: (a: GoalsAnswers) => void
  review?: GoalsAnswers
}) {
  const [step, setStep] = useState<Step>(review ? 'results' : 'intro')
  const [goals, setGoals] = useState<Goal[]>(review?.goals ?? [])
  const current = goals[goals.length - 1]

  useEffect(() => {
    document.querySelector('.cx-viewport')?.scrollTo({ top: 0 })
    if (step === 'loading') {
      const t = window.setTimeout(() => setStep('add'), 3800)
      return () => window.clearTimeout(t)
    }
  }, [step])

  const level = current?.readiness || 0
  const stage = level ? TTM_STAGES[level - 1] : null

  const rewardNow = typeof reward === 'function' ? reward({ goals }) : reward
  return (
    <div className="jf gl">
      {step === 'intro' && (
        <div className="jf-intro">
          <AdventureBadge />
          <div className="jf-hero">
            <Photo className="jf-hero-img" src="./goals/intro.png" fallback="gl-hero-fallback" />
          </div>
          <h2 className="jf-title">Welcome to Your Goals Adventure!</h2>
          <p className="jf-body">
            Let’s turn your aspirations into action by setting a meaningful long-term goal.
          </p>
          <div className="jf-start">
            <button className="jf-go" type="button" onClick={() => setStep('loading')}>
              Get Started
            </button>
            <span className="jf-min">
              <ClockIcon /> Takes 3 min
            </span>
          </div>
        </div>
      )}

      {/* A moment while her goals are drawn from what she has already said:
          the mark turning and pulsing. */}
      {step === 'loading' && (
        <div className="gl-loading" role="status">
          {/* The knomee mark's own paths, in colour, each ring turning and
              pulsing on its own time around the beating heart. */}
          <svg className="gl-mark" viewBox="0 0 288 288" width="104" height="104" aria-hidden>
            {MARK_PARTS.map((d, i) => (
              <g key={i} className={`gl-mark-spin gl-mark-${i}`}>
                <path d={d} />
              </g>
            ))}
          </svg>
          <h2 className="gl-hold">Hold tight!</h2>
          <p>Generating recommended Goals just for you…</p>
        </div>
      )}

      {step === 'add' && (
        <AddGoalModal
          suggestions={financialId.suggestedGoals}
          onClose={() => (goals.length ? setStep('added') : setStep('intro'))}
          onAdd={(g) => {
            /* Dated today: the panel stamps the advisor demo's fixed day. */
            const d = new Date()
            const p2 = (n: number) => String(n).padStart(2, '0')
            const updated = `${p2(d.getMonth() + 1)}/${p2(d.getDate())}/${d.getFullYear()}`
            const bare = !g.pros?.length && !g.cons?.length && !g.note
            const filled = bare ? { ...g, ...(SAMPLE_DETAIL[g.title] ?? SAMPLE_OWN) } : g
            setGoals((gs) => [...gs, { ...filled, updated }])
            setStep('added')
          }}
        />
      )}

      {step === 'added' && current && (
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
          <h2 className="gl-title">Goal Added Successfully!</h2>
          <div className="gl-summary">
            <span className="gl-summary-head">Goal Summary</span>
            <b className="gl-summary-title">{current.title}</b>
            <GoalDetail g={current} />
          </div>
          <div className="gl-acts">
            <button className="jf-go" type="button" onClick={() => setStep('readiness')}>
              Assess My Readiness
            </button>
            <button className="gl-second" type="button" onClick={() => setStep('add')}>
              Add Another Goal
            </button>
            <button className="gl-link" type="button" onClick={() => setStep('results')}>
              Exit
            </button>
          </div>
        </div>
      )}

      {step === 'readiness' && current && (
        <ReadinessModal
          goal={current}
          saveLabel="See My Goal Summary"
          onClose={() => setStep('added')}
          onSave={(lv) => {
            setGoals((gs) => gs.map((g, i) => (i === gs.length - 1 ? { ...g, readiness: lv } : g)))
            setStep('results')
          }}
        />
      )}

      {step === 'results' && (
        <div className="jr glr">
          <Reveal>
            <h2 className="jr-title">Goal Readiness</h2>
            <p className="jr-sub">{current?.title ?? 'Your goal'}</p>
            {/* Her stage as the picture: the readiness bars at size on a
                living sky, and the stage's name. */}
            <figure className="jr-memory glr-hero">
              <span className="jr-sky glr-sky" aria-hidden>
                <i className="jr-sun" />
                <i className="jr-glow jr-glow-a" />
                <i className="jr-glow jr-glow-b" />
                <i className="jr-glow jr-glow-c" />
              </span>
              <span className="glr-kicker">My readiness stage for my goal is</span>
              <div className="glr-stage">
                <StageArt level={level || 1} />
                <b>{(stage ?? TTM_STAGES[0]).toUpperCase()}</b>
              </div>
              <p className="glr-line">{STAGE_LINE[(level || 1) - 1]}</p>
            </figure>
          </Reveal>

          {/* What she set, as she set it: the same summary the goal was
              added with, now with its stage on it — one per goal. */}
          {goals.length > 0 && (
            <Reveal>
              <h3 className="jr-h">{goals.length > 1 ? 'Your goals' : 'Goal Summary'}</h3>
              <div className="glr-summaries">
                {goals.map((g, i) => (
                  <div className="gl-summary glr-summary" key={`${i}:${g.title}`} style={{ ['--i' as string]: i }}>
                    <b className="gl-summary-title">{g.title}</b>
                    <GoalDetail g={g} />
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          <Reveal className="jr-reward">
            <p className="jr-reward-line">You got a reward!</p>
            <button className="jr-claim" type="button" onClick={() => setStep('badge')}>
              <span>Claim Badge</span>
            </button>
          </Reveal>
        </div>
      )}

      {step === 'badge' && (
        <JoyReward
          badge={bgGoals}
          name="Goals"
          from={rewardNow.before}
          done={rewardNow.after}
          total={rewardNow.total}
          next={rewardNow.next}
          card={rewardNow.card}
          idName={rewardNow.idName}
          onNext={() => onComplete({ goals })}
        />
      )}
    </div>
  )
}
