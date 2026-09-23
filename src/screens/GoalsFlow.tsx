/* Goals, taken on the phone.
 *
 * The fifth adventure, and the flow the page already has: the same Add a Goal
 * panel and the same readiness questions the Financial ID opens, walked
 * through in order. First a moment while the goals are "generated" from what
 * the other adventures said; then choosing one, or writing one, and its
 * detail; then "Goal Added Successfully!" with the goal's summary; then its
 * readiness, which lands on a stage of change; then the badge — the fifth.
 */

import { useEffect, useState } from 'react'
import './joyFlow.css'
import './joyResults.css'
import './goalsFlow.css'
import { financialId, type Goal } from '../data/financialId'
import AddGoalModal from './AddGoalModal'
import ReadinessModal from './ReadinessModal'
import JoyReward from './JoyReward'
import { Reveal } from './JoyResults'
import { MARK_PARTS } from './ClientExperienceScreen'
import { GoalDetail, TTM_ART, TTM_STAGES } from './profileParts'
import bgGoals from '../assets/badges/goals-on-plum.svg'

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

export default function GoalsFlow({
  reward,
  onComplete,
  review,
}: {
  reward: { before: number; after: number; total: number; next: string }
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

  return (
    <div className="jf gl">
      {step === 'intro' && (
        <div className="jf-intro">
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
          saveLabel="See my Goal Summary"
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
          from={reward.before}
          done={reward.after}
          total={reward.total}
          next={reward.next}
          onNext={() => onComplete({ goals })}
        />
      )}
    </div>
  )
}
