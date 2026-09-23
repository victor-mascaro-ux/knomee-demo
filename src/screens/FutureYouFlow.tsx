/* Future You, taken on the phone.
 *
 * The fourth adventure: a vision of the life they are saving for, built a
 * piece at a time. First a breath — an orb that grows as they breathe in and
 * settles as they breathe out, while they picture it. Then where it is, what
 * they are doing, who they are with (photographs, as Financial Joy asks), how
 * far away it is (a road their pin travels along), the detail of it, and a
 * postcard written back from there, which takes a stamp and a postmark when
 * it is done. The ending is the vision as a poster, and the postcard under it.
 *
 * The house rules hold: OK on a question left blank records her sample
 * answer, and a double-click on the empty postcard writes hers in.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './joyFlow.css'
import './joyResults.css'
import './futureYouFlow.css'
import { financialId } from '../data/financialId'
import JoyReward from './JoyReward'
import { AboutOverlay, useEndingOverlay, CountUp, Reveal } from './JoyResults'
import bgFutureYou from '../assets/badges/future-you-on-plum.svg'

interface Pick {
  label: string
  src: string
}
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const picks = (labels: string[]): Pick[] => labels.map((label) => ({ label, src: `./future-you/${slug(label)}.png` }))

const WHERE = picks(['At the beach', 'In the mountains', 'In a big city', 'In a suburb', 'In the country', 'Abroad'])
const DOING = picks(['Relaxing', 'Creative pursuits', 'Running a business', 'Traveling', 'Helping others', 'Socializing'])
const WITH = picks(['Family', 'Friends', 'A larger group', 'Solo', 'A romantic partner', 'Business partners'])
/* Each photograph's angle on the table: loose, never the same twice in a row. */
const TILT = [-6, 4, -3, 7, -8, 2, 5, -4, 3, -7, 6, -2]
const WHEN = ['1–5 years', '5–10 years', '10–15 years', '15–20 years', 'Over 20 years']

/* The detail of the life, the design's five kinds. */
const DETAIL: { group: string; icon: string; items: string[] }[] = [
  { group: 'Activities', icon: '✺', items: ['Cooking', 'Art', 'Entertaining', 'Gardening', 'Reading', 'Music', 'Gaming', 'Dancing'] },
  { group: 'Culture', icon: '♫', items: ['Theater', 'Concerts', 'Museums', 'Cinema', 'Festivals', 'History'] },
  { group: 'Travel', icon: '✈', items: ['International', 'Road trips', 'Cruises', 'Camping', 'Solo', 'Adventure'] },
  { group: 'Work', icon: '◆', items: ['Big work', 'Board seats', 'Volunteer', 'Philanthropic giving', 'Side hustle', 'Consulting'] },
  { group: 'Health', icon: '♥', items: ['Gym', 'Sports', 'Outdoors', 'Meditating', 'Yoga', 'Walking', 'Cycling', 'Water sports'] },
]

export interface FutureYouAnswers {
  where: string[]
  doing: string[]
  with: string[]
  when: string | null
  detail: string[]
  postcard: string
}

/* Her authored answers: the samples OK records and a double-click writes. */
export const SAMPLE_FUTURE: FutureYouAnswers = {
  where: financialId.futureYou.where,
  doing: financialId.futureYou.what,
  with: financialId.futureYou.who.map((w) => (w === 'Romantic partner' ? 'A romantic partner' : w)),
  when: '5–10 years',
  detail: ['Cooking', 'Entertaining', 'Concerts', 'International', 'Road trips', 'Volunteer', 'Walking', 'Yoga'],
  postcard: `Dear Me,\n\n${financialId.postcard}\n\nWith love,\nFuture You`,
}

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

/* The breath: in for four, out for four, while they picture it. */
function Breathe() {
  /* It starts small and begins breathing in at once: starting full-size on
     "Inhale" left four still seconds before anything moved. */
  const [phase, setPhase] = useState<'start' | 'in' | 'out'>('start')
  useEffect(() => {
    const go = window.setTimeout(() => setPhase('in'), 60)
    const t = window.setInterval(() => setPhase((p) => (p === 'out' ? 'in' : 'out')), 4000)
    return () => {
      window.clearTimeout(go)
      window.clearInterval(t)
    }
  }, [])
  const inhale = phase !== 'out'
  return (
    <div className="fy-breathe">
      <h2 className="fy-h">This is your future.</h2>
      <p className="fy-sub">Take a moment to visualize what it looks like for you.</p>
      <div className={`fy-orb${phase === 'in' ? ' is-in' : ' is-out'}`} aria-live="polite">
        <i className="fy-ring fy-ring-3" />
        <i className="fy-ring fy-ring-2" />
        <i className="fy-ring fy-ring-1" />
        <span className="fy-core">
          <b key={inhale ? 'in' : 'out'}>{inhale ? 'Inhale' : 'Exhale'}</b>
        </span>
      </div>
      <p className="fy-prompts">
        Where are you?
        <br />
        What are you doing?
        <br />
        Who are you with?
        <br />
        How do you feel in the future you see?
      </p>
    </div>
  )
}

/* One of the three photograph questions. */
function PhotoAsk({
  title,
  sub,
  options,
  chosen,
  other,
  otherPlaceholder,
  onToggle,
  onOther,
}: {
  title: string
  sub: string
  options: Pick[]
  chosen: string[]
  other: string
  otherPlaceholder: string
  onToggle: (label: string) => void
  onOther: (v: string) => void
}) {
  return (
    <div className="jf-pick fy-ask">
      <h2 className="jf-pick-title">{title}</h2>
      <p className="jf-pick-sub">{sub}</p>
      <p className="jf-pick-note">Choose as many as you see.</p>
      <div className="jf-photos">
        {options.map((o) => {
          const on = chosen.includes(o.label)
          return (
            <button
              key={o.label}
              type="button"
              className={`jf-photo${on ? ' is-on' : ''}`}
              aria-pressed={on}
              onClick={() => onToggle(o.label)}
            >
              <span className="jf-photo-frame">
                <Photo src={o.src} fallback="jf-photo-fallback" />
              </span>
              <span className="jf-photo-label">{o.label}</span>
            </button>
          )
        })}
      </div>
      <label className="jf-other-label" htmlFor="fy-other">
        Other
      </label>
      <span className="jf-other-hint">Or write your answer.</span>
      <input
        id="fy-other"
        className="jf-other"
        value={other}
        placeholder={otherPlaceholder}
        onChange={(e) => onOther(e.target.value)}
      />
    </div>
  )
}

/* How far away: a road, and her pin travels along it to the band chosen. */
function Road({
  value,
  onChange,
  still,
}: {
  value: string | null
  onChange?: (v: string) => void
  /** On the ending: the road as she left it, not a question. */
  still?: boolean
}) {
  const at = value ? WHEN.indexOf(value) : -1
  /* The pin can be taken hold of and slid along the road — or the road
     pressed anywhere — and it snaps to the nearest stop as it goes. */
  const road = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const stopAt = (clientX: number) => {
    const r = road.current?.getBoundingClientRect()
    if (!r || !r.width) return 0
    const k = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    return Math.round(k * (WHEN.length - 1))
  }
  const onDown = (e: React.PointerEvent) => {
    if (still || !onChange || e.button !== 0) return
    e.preventDefault()
    setDragging(true)
    let last = stopAt(e.clientX)
    onChange(WHEN[last])
    const move = (ev: PointerEvent) => {
      const i = stopAt(ev.clientX)
      if (i !== last) {
        last = i
        onChange(WHEN[i])
      }
    }
    const up = () => {
      setDragging(false)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }
  return (
    <div className={`fy-when${still ? ' is-still' : ''}`}>
      {!still && (
        <>
          <h2 className="fy-h">How far in the future is your vision?</h2>
          <p className="fy-sub">Pick the stretch of road it sits on.</p>
        </>
      )}
      <div
        ref={road}
        className={`fy-road${dragging ? ' is-dragging' : ''}`}
        style={{ ['--at' as string]: Math.max(0, at), ['--n' as string]: WHEN.length - 1 }}
        onPointerDown={onDown}
        {...(still ? {} : { 'data-no-drag-scroll': '' })}
      >
        <i className="fy-road-line" />
        <i className={`fy-road-done${at < 0 ? ' is-empty' : ''}`} />
        <span className={`fy-pin${at < 0 ? ' is-waiting' : ''}`} aria-hidden>
          <svg viewBox="0 0 24 32" width="26" height="34">
            <path d="M12 1C6 1 1.5 5.6 1.5 11.4 1.5 19 12 31 12 31s10.5-12 10.5-19.6C22.5 5.6 18 1 12 1Z" fill="var(--k-plum)" />
            <circle cx="12" cy="11.5" r="4.2" fill="var(--k-lime)" />
          </svg>
        </span>
        <div className="fy-stops">
          {WHEN.map((w, i) => (
            <button
              key={w}
              type="button"
              className={`fy-stop${i === at ? ' is-on' : ''}${i < at ? ' is-past' : ''}`}
              aria-pressed={i === at}
              disabled={still}
              onClick={() => onChange?.(w)}
            >
              <i />
              <span>{w}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* The detail: five kinds, each with its own and a way to add theirs. */
function Detail({
  chosen,
  onToggle,
  extra,
  onAdd,
}: {
  chosen: string[]
  onToggle: (v: string) => void
  extra: Record<string, string[]>
  onAdd: (group: string, v: string) => void
}) {
  const [adding, setAdding] = useState<string | null>(null)
  const [text, setText] = useState('')
  return (
    <div className="fy-detail">
      <h2 className="fy-h fy-h-sm">Share more detail about what Future You’s life will include.</h2>
      <p className="fy-sub">Tap everything that belongs in it, or add your own.</p>
      {DETAIL.map((d, gi) => (
        <section className="fy-group" key={d.group} style={{ ['--g' as string]: gi }}>
          <h3>
            <span aria-hidden>{d.icon}</span> {d.group}
          </h3>
          <div className="fy-chips">
            {[...d.items, ...(extra[d.group] ?? [])].map((it) => (
              <button
                key={it}
                type="button"
                className={`fy-chip${chosen.includes(it) ? ' is-on' : ''}`}
                aria-pressed={chosen.includes(it)}
                onClick={() => onToggle(it)}
              >
                {it}
              </button>
            ))}
            {adding === d.group ? (
              <input
                className="fy-chip-input"
                autoFocus
                value={text}
                placeholder="Your own"
                onChange={(e) => setText(e.target.value)}
                onBlur={() => {
                  if (text.trim()) onAdd(d.group, text.trim())
                  setText('')
                  setAdding(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  if (e.key === 'Escape') {
                    setText('')
                    setAdding(null)
                  }
                }}
              />
            ) : (
              <button type="button" className="fy-chip fy-chip-add" onClick={() => setAdding(d.group)}>
                + Add your own
              </button>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

/* The postcard on the ending: it slides in only once she has scrolled down
   to it — watched against the phone's own scrolling page, and only when a
   good part of the card is showing, so it does not arrive unseen on load. */
function ArrivingCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [arrived, setArrived] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const root = el.closest('.cx-viewport')
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArrived(true)
          io.disconnect()
        }
      },
      { root, threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  /* Watched on a wrapper that stays put: the card itself waits off to the
     left, where it would never be seen coming into view. */
  return (
    <div ref={ref} className="fyr-arrive">
      <div className={`fy-card is-stamped fyr-card${arrived ? ' is-arrived' : ''}`}>{children}</div>
    </div>
  )
}

/* The postcard back from there: airmail edge, a stamp, and — once there are
   words on it — a postmark that lands. */
function Postcard({
  text,
  onChange,
  onSample,
  stamped,
  sent,
}: {
  text: string
  onChange: (v: string) => void
  onSample: () => void
  stamped: boolean
  sent?: boolean
}) {
  /* The card grows with what is written on it — a postcard does not scroll. */
  const field = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = field.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])
  return (
    <div className="fy-post">
      <h2 className="fy-h fy-h-sm">Now step into the shoes of Future You.</h2>
      <p className="fy-sub">Write a postcard to yourself, right now, from Future You.</p>
      <div className={`fy-card${stamped ? ' is-stamped' : ''}${sent ? ' is-sent' : ''}`}>
        <span className="fy-stamp" aria-hidden>
          <i>✈</i>
        </span>
        <span className="fy-postmark" aria-hidden>
          FUTURE YOU
          <br />
          ✦ POSTED ✦
        </span>
        <textarea
          ref={field}
          className="fy-card-field"
          value={text}
          placeholder="Dear Me,"
          onChange={(e) => onChange(e.target.value)}
          onDoubleClick={(e) => {
            if (!e.currentTarget.value.trim()) onSample()
          }}
        />
      </div>
    </div>
  )
}

type Step = 'intro' | 'breathe' | 'where' | 'doing' | 'with' | 'when' | 'detail' | 'postcard' | 'results' | 'badge'
const QUESTIONS: Step[] = ['breathe', 'where', 'doing', 'with', 'when', 'detail', 'postcard']

export default function FutureYouFlow({
  reward,
  onComplete,
  review,
}: {
  reward: { before: number; after: number; total: number; next: string }
  onComplete: (a: FutureYouAnswers) => void
  review?: FutureYouAnswers
}) {
  const [step, setStep] = useState<Step>(review ? 'results' : 'intro')
  const [a, setA] = useState<FutureYouAnswers>(
    () => review ?? { where: [], doing: [], with: [], when: null, detail: [], postcard: '' },
  )
  const [other, setOther] = useState<Record<string, string>>({})
  const [extra, setExtra] = useState<Record<string, string[]>>({})
  const [stamped, setStamped] = useState(false)
  /* After the postmark: the card is sent — it slides away to the right. */
  const [sent, setSent] = useState(false)
  /* A print tapped on the ending: shown large, as a phone shows a photograph
     — a tap is what a hover is on a mouse. */
  const [zoom, setZoom] = useState<Pick | null>(null)
  /* The ending's overlay, as the other adventures have it. */
  const ending = useEndingOverlay(step === 'results')
  const typing = useRef(0)
  useEffect(() => () => window.clearInterval(typing.current), [])

  useEffect(() => {
    document.querySelector('.cx-viewport')?.scrollTo({ top: 0 })
  }, [step])

  const toggle = (key: 'where' | 'doing' | 'with' | 'detail', v: string) =>
    setA((p) => ({ ...p, [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v] }))

  const writeSample = () => {
    window.clearInterval(typing.current)
    const full = SAMPLE_FUTURE.postcard
    let n = 0
    typing.current = window.setInterval(() => {
      n = Math.min(full.length, n + 4)
      setA((p) => ({ ...p, postcard: full.slice(0, n) }))
      if (n >= full.length) window.clearInterval(typing.current)
    }, 16)
  }

  const qi = QUESTIONS.indexOf(step)
  const withOther = (key: 'where' | 'doing' | 'with') =>
    other[key]?.trim() ? [...a[key], other[key].trim()] : a[key]

  const onOk = () => {
    /* Left blank: the sample goes in, so a demo still arrives at a vision. */
    if (step === 'where' && !withOther('where').length) setA((p) => ({ ...p, where: SAMPLE_FUTURE.where }))
    if (step === 'doing' && !withOther('doing').length) setA((p) => ({ ...p, doing: SAMPLE_FUTURE.doing }))
    if (step === 'with' && !withOther('with').length) setA((p) => ({ ...p, with: SAMPLE_FUTURE.with }))
    if (step === 'when' && !a.when) setA((p) => ({ ...p, when: SAMPLE_FUTURE.when }))
    if (step === 'detail' && !a.detail.length) setA((p) => ({ ...p, detail: SAMPLE_FUTURE.detail }))
    if (step === 'postcard') {
      window.clearInterval(typing.current)
      if (!a.postcard.trim()) setA((p) => ({ ...p, postcard: SAMPLE_FUTURE.postcard }))
      /* Posted: the postmark lands, the card goes off to the right as if it
         had been dropped in the box, then the ending. */
      setStamped(true)
      window.setTimeout(() => setSent(true), 750)
      window.setTimeout(() => {
        setA((p) => ({
          ...p,
          where: withOther('where'),
          doing: withOther('doing'),
          with: withOther('with'),
        }))
        setStep('results')
      }, 1450)
      return
    }
    setStep(QUESTIONS[qi + 1])
  }
  const previous = () => {
    if (qi > 0) return setStep(QUESTIONS[qi - 1])
    setStep('intro')
  }


  return (
    <div className="jf fy">
      {step === 'intro' && (
        <div className="jf-intro">
          <div className="jf-hero">
            <Photo className="jf-hero-img" src="./future-you/intro.png" fallback="fy-hero-fallback" />
          </div>
          <h2 className="jf-title">Let’s materialize your vision for Future You!</h2>
          <p className="jf-body">
            The clearer your vision, the more likely you are to achieve it.
          </p>
          <div className="jf-start">
            <button className="jf-go" type="button" onClick={() => setStep('breathe')}>
              Get Started
            </button>
            <span className="jf-min">
              <ClockIcon /> Takes 1 min
            </span>
          </div>
        </div>
      )}

      {step === 'breathe' && <Breathe />}

      {step === 'where' && (
        <PhotoAsk
          title="Let’s materialize your vision!"
          sub="Where is Future You?"
          options={WHERE}
          chosen={a.where}
          other={other.where ?? ''}
          otherPlaceholder="In the desert somewhere"
          onToggle={(v) => toggle('where', v)}
          onOther={(v) => setOther((o) => ({ ...o, where: v }))}
        />
      )}
      {step === 'doing' && (
        <PhotoAsk
          title="Let’s materialize your vision!"
          sub="What is Future You doing?"
          options={DOING}
          chosen={a.doing}
          other={other.doing ?? ''}
          otherPlaceholder="Writing a memoir"
          onToggle={(v) => toggle('doing', v)}
          onOther={(v) => setOther((o) => ({ ...o, doing: v }))}
        />
      )}
      {step === 'with' && (
        <PhotoAsk
          title="Let’s materialize your vision!"
          sub="Who is Future You with?"
          options={WITH}
          chosen={a.with}
          other={other.with ?? ''}
          otherPlaceholder="My grandchildren"
          onToggle={(v) => toggle('with', v)}
          onOther={(v) => setOther((o) => ({ ...o, with: v }))}
        />
      )}
      {step === 'when' && <Road value={a.when} onChange={(v) => setA((p) => ({ ...p, when: v }))} />}
      {step === 'detail' && (
        <Detail
          chosen={a.detail}
          onToggle={(v) => toggle('detail', v)}
          extra={extra}
          onAdd={(g, v) => {
            setExtra((e) => ({ ...e, [g]: [...(e[g] ?? []), v] }))
            setA((p) => ({ ...p, detail: [...p.detail, v] }))
          }}
        />
      )}
      {step === 'postcard' && (
        <Postcard
          text={a.postcard}
          onChange={(v) => setA((p) => ({ ...p, postcard: v }))}
          onSample={writeSample}
          stamped={stamped}
          sent={sent}
        />
      )}

      {step === 'results' && (
        <div className={`jr fyr${ending.held ? ' is-held' : ''}`} key={ending.run}>
          <button className="jr-learn" type="button" onClick={ending.open}>
            Learn more
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
              <circle cx="8" cy="8" r="7" fill="currentColor" />
              <path d="M8 7v4.2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="8" cy="4.7" r="1" fill="#fff" />
            </svg>
          </button>
          {ending.about && (
            <AboutOverlay
              title="You visualized Future You!"
              share={80}
              onClose={ending.close}
              first={
                <>
                  <b>
                    <CountUp to={80} />%
                  </b>{' '}
                  of respondents share your vision of{' '}
                  <b>
                    {[
                      (a.doing[0] ?? 'living well').toLowerCase(),
                      (a.where[0] ?? '').toLowerCase(),
                      a.with[0] ? `with ${a.with[0].toLowerCase().replace(/^a /, 'a ')}` : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </b>
                  .
                </>
              }
              second={
                <p>
                  Research proves that when you vividly <b>connect with your future self</b>, you
                  bridge the gap between today’s choices and tomorrow’s well-being. You just took a{' '}
                  <b>powerful and actionable step</b> toward the life you want.
                </p>
              }
            />
          )}
          <Reveal>
            <h2 className="jr-title">You visualized Future You</h2>
            <p className="jr-sub">This is the life you are preparing for:</p>
            {/* The vision as a poster: the living sky, and on it where, what,
                with whom and when, each stamped on in turn. */}
            <figure className="jr-memory fyr-poster">
              <span className="jr-sky fyr-sky" aria-hidden>
                <i className="jr-sun" />
                <i className="jr-glow jr-glow-a" />
                <i className="jr-glow jr-glow-b" />
                <i className="jr-glow jr-glow-c" />
              </span>
              {/* Where, doing, with: the words, and beside them the pictures
                  she chose for them, dropped on like photographs, each at its
                  own angle. When: the road, her pin at her stretch of it. */}
              <div className="fyr-lines">
                {(
                  [
                    ['Where', a.where, WHERE],
                    ['Doing', a.doing, DOING],
                    ['With', a.with, WITH],
                  ] as [string, string[], Pick[]][]
                )
                  .filter(([, v]) => v.length)
                  .map(([k, v, pool], i) => (
                    <div className="fyr-line" key={k} style={{ ['--i' as string]: i }}>
                      <p>
                        <span>{k}</span>
                        <b>{v.join(', ')}</b>
                      </p>
                      <div className="fyr-cluster">
                        {pool
                          .filter((o) => v.includes(o.label))
                          .map((o, j) => (
                            <button
                              type="button"
                              className="fyr-mini"
                              key={o.label}
                              aria-label={`${o.label} — see it larger`}
                              onClick={() => setZoom(o)}
                              style={{
                                ['--j' as string]: j + i * 3,
                                ['--r' as string]: `${TILT[(j + i * 2) % TILT.length]}deg`,
                              }}
                            >
                              <Photo src={o.src} fallback="jf-photo-fallback" />
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                {a.when && (
                  <div className="fyr-line fyr-line-when" style={{ ['--i' as string]: 3 }}>
                    <p>
                      <span>When</span>
                      <b>{a.when}</b>
                    </p>
                    <Road value={a.when} still />
                  </div>
                )}
              </div>
            </figure>
          </Reveal>

          {a.detail.length > 0 && (
            <Reveal>
              <h3 className="jr-h">What it includes</h3>
              <div className="fyr-chips">
                {a.detail.map((d, i) => (
                  <span key={d} className="fyr-chip" style={{ ['--i' as string]: i }}>
                    {d}
                  </span>
                ))}
              </div>
            </Reveal>
          )}

          <Reveal>
            <h3 className="jr-h">Your postcard</h3>
            <p className="jr-sub">Sent back from there:</p>
            <ArrivingCard>
              <span className="fy-stamp" aria-hidden>
                <i>✈</i>
              </span>
              <span className="fy-postmark" aria-hidden>
                FUTURE YOU
                <br />
                ✦ POSTED ✦
              </span>
              <p className="fyr-words">
                {/* Whole, not typed: the card arriving is the motion. */}
                {a.postcard || SAMPLE_FUTURE.postcard}
              </p>
            </ArrivingCard>
            <p className="jr-reading">
              <span className="jr-reading-mark" aria-hidden>
                ✦
              </span>
              {a.when ? `In ${a.when.toLowerCase()}, ` : ''}you see yourself {a.where[0]?.toLowerCase() ?? 'somewhere new'}
              {a.with[0] ? `, with ${a.with[0].toLowerCase()}` : ''}. Your advisor will build the plan
              toward exactly that.
            </p>
          </Reveal>

          <Reveal className="jr-reward">
            <p className="jr-reward-line">You got a reward!</p>
            <button className="jr-claim" type="button" onClick={() => setStep('badge')}>
              <span>Claim Badge</span>
            </button>
          </Reveal>
        </div>
      )}

      {zoom && (
        <div className="modal-backdrop fyr-zoom" role="dialog" aria-modal="true" aria-label={zoom.label} onClick={() => setZoom(null)}>
          <figure className="fyr-zoom-print">
            <span className="fyr-zoom-img">
              <Photo src={zoom.src} fallback="jf-photo-fallback" />
            </span>
            <figcaption>{zoom.label}</figcaption>
          </figure>
        </div>
      )}

      {step === 'badge' && (
        <JoyReward
          badge={bgFutureYou}
          name="Future You"
          from={reward.before}
          done={reward.after}
          total={reward.total}
          next={reward.next}
          onNext={() => onComplete(a)}
        />
      )}

      {qi >= 0 && (
        <div className="jf-foot">
          <div className="jf-where">
            <div className="af-progress" aria-hidden>
              {QUESTIONS.map((s, i) => (
                <i key={s} className={i <= qi ? 'is-on' : ''} />
              ))}
            </div>
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
          <button className="cx-start jf-ok" type="button" onClick={onOk} disabled={stamped}>
            {step === 'postcard' ? 'Send' : 'OK'}
          </button>
        </div>
      )}
    </div>
  )
}
