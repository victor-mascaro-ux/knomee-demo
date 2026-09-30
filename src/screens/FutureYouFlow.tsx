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
 *
 * The mechanism is shared: the advisor's Future You is this same flow handed
 * different `content` — its own questions, photographs, road and detail —
 * and without samples, so a
 * question left blank is skipped. The client's is the default.
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import './joyFlow.css'
import './joyResults.css'
import './futureYouFlow.css'
import { financialId } from '../data/financialId'
import JoyReward from './JoyReward'
import { OtherField, OtherTile, PhotoCheck } from './PhotoOther'
import { AboutOverlay, useEndingOverlay, CountUp, Reveal } from './JoyResults'
import bgFutureYou from '../assets/badges/future-you-on-plum.svg'
import { IntroGets, type Gets } from './IntroGets'

export interface Pick {
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
export type DetailGroup = { group: string; icon: string; items: string[] }
const DETAIL: DetailGroup[] = [
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
  /** 1–5, where a flow asks how clear the picture was. */
  clarity?: number | null
}

/* Her authored answers: the samples OK records and a double-click writes. */
export const SAMPLE_FUTURE: FutureYouAnswers = {
  where: financialId.futureYou.where,
  doing: financialId.futureYou.what,
  with: financialId.futureYou.who.map((w) => (w === 'Romantic partner' ? 'A romantic partner' : w)),
  when: '5–10 years',
  detail: ['Cooking', 'Entertaining', 'Concerts', 'International', 'Road trips', 'Volunteer', 'Walking', 'Yoga'],
  postcard: `Dear Me,\n\n${financialId.postcard}\n\nWith love,\nFuture You`,
  clarity: 4,
}

type AskKey = 'where' | 'doing' | 'with'

interface PhotoQuestion {
  title: string
  sub: string
  options: Pick[]
  otherPlaceholder: string
  /** One answer rather than several. */
  single?: boolean
}

/** Everything that makes this the client's Future You rather than another
    adventure of the same shape. */
export interface FutureYouContent {
  intro: { image: string; title: string; body: string; minutes: number; gets?: Gets }
  breathe: { title: string; sub: string; prompts: string[] }
  ask: Record<AskKey, PhotoQuestion>
  when: { title: string; sub: string; stops: string[] }
  detail: { title: string; sub: string; groups: DetailGroup[] }
  /** A 1–5 question after the detail, where the flow asks one. */
  clarity?: { title: string; sub?: string; low: string; high: string }
  postcard: { title: string; sub: string; placeholder: string }
  sample: FutureYouAnswers
  /** Whether OK on a question left blank records the sample (a demo) or
      skips it (somebody actually answering). */
  fill: boolean
  results: {
    title: string
    sub: string
    detailTitle: string
    postcardSub: string
    line: (a: FutureYouAnswers) => string
    about: (a: FutureYouAnswers) => { title: string; share: number; first: ReactNode; second: ReactNode }
  }
  /** The badge the reward hands over. Left out, there is no reward screen:
      the ending's button is Continue and finishes the adventure. */
  badge?: string
  badgeName?: string
}

export const CLIENT_FUTURE: FutureYouContent = {
  intro: {
    image: './future-you/intro.png',
    title: 'Let’s materialize your vision for Future You!',
    body: 'The clearer your vision, the more likely you are to achieve it.',
    minutes: 1,
  },
  breathe: {
    title: 'This is your future.',
    sub: 'Take a moment to visualize what it looks like for you.',
    prompts: ['Where are you?', 'What are you doing?', 'Who are you with?', 'How do you feel in the future you see?'],
  },
  ask: {
    where: { title: 'Let’s materialize your vision!', sub: 'Where is Future You?', options: WHERE, otherPlaceholder: 'In the desert somewhere' },
    doing: { title: 'Let’s materialize your vision!', sub: 'What is Future You doing?', options: DOING, otherPlaceholder: 'Writing a memoir' },
    with: { title: 'Let’s materialize your vision!', sub: 'Who is Future You with?', options: WITH, otherPlaceholder: 'My grandchildren' },
  },
  when: { title: 'How far in the future is your vision?', sub: 'Pick the stretch of road it sits on.', stops: WHEN },
  detail: {
    title: 'Share more detail about what Future You’s life will include.',
    sub: 'Tap everything that belongs in it, or add your own.',
    groups: DETAIL,
  },
  clarity: { title: 'How clear was the picture of Future You?', low: 'Very blurry', high: 'Vividly clear' },
  postcard: {
    title: 'Now step into the shoes of Future You.',
    sub: 'Write a postcard to yourself, right now, from Future You.',
    placeholder: 'Dear Me,',
  },
  sample: SAMPLE_FUTURE,
  fill: true,
  results: {
    title: 'You visualized Future You',
    sub: 'This is the life you are preparing for:',
    detailTitle: 'What it includes',
    postcardSub: 'Sent back from there:',
    line: (a) =>
      `${a.when ? `In ${a.when.toLowerCase()}, ` : ''}you see yourself ${a.where[0]?.toLowerCase() ?? 'somewhere new'}${
        a.with[0] ? `, with ${a.with[0].toLowerCase()}` : ''
      }. Your advisor will build the plan toward exactly that.`,
    about: (a) => ({
      title: 'You visualized Future You!',
      share: 80,
      first: (
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
      ),
      second: (
        <p>
          Research proves that when you vividly <b>connect with your future self</b>, you bridge the
          gap between today’s choices and tomorrow’s well-being. You just took a{' '}
          <b>powerful and actionable step</b> toward the life you want.
        </p>
      ),
    }),
  },
  badge: bgFutureYou,
  badgeName: 'Future You',
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
function Breathe({ title, sub, prompts }: FutureYouContent['breathe']) {
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
      <h2 className="fy-h">{title}</h2>
      <p className="fy-sub">{sub}</p>
      <div className={`fy-orb${phase === 'in' ? ' is-in' : ' is-out'}`} aria-live="polite">
        <i className="fy-ring fy-ring-3" />
        <i className="fy-ring fy-ring-2" />
        <i className="fy-ring fy-ring-1" />
        <span className="fy-core">
          <b key={inhale ? 'in' : 'out'}>{inhale ? 'Inhale' : 'Exhale'}</b>
        </span>
      </div>
      <p className="fy-prompts">
        {prompts.map((p, i) => (
          <span key={p}>
            {i > 0 && <br />}
            {p}
          </span>
        ))}
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
  single,
  onToggle,
  onOther,
}: {
  title: string
  sub: string
  options: Pick[]
  chosen: string[]
  other: string
  otherPlaceholder: string
  single?: boolean
  onToggle: (label: string) => void
  onOther: (v: string) => void
}) {
  const [otherOpen, setOtherOpen] = useState(!!other.trim())
  const showOther = otherOpen || !!other.trim()
  return (
    <div className="jf-pick fy-ask">
      <h2 className="jf-pick-title">{title}</h2>
      <p className="jf-pick-sub">{sub}</p>
      <p className="jf-pick-note">{single ? 'Choose the one that fits best.' : 'Choose as many as you see.'}</p>
      <div className="jf-photos">
        {options.map((o, i) => {
          const on = chosen.includes(o.label)
          return (
            <button
              key={o.label}
              type="button"
              className={`jf-photo${on ? ' is-on' : ''}`}
              style={{ ['--i' as string]: i }}
              aria-pressed={on}
              onClick={() => {
                /* One answer only: a photograph chosen replaces their own words. */
                if (single && !on) {
                  setOtherOpen(false)
                  onOther('')
                }
                onToggle(o.label)
              }}
            >
              <span className="jf-photo-frame">
                <Photo src={o.src} fallback="jf-photo-fallback" />
                <PhotoCheck />
              </span>
              <span className="jf-photo-label">{o.label}</span>
            </button>
          )
        })}
        <OtherTile
          i={options.length}
          open={showOther}
          filled={!!other.trim()}
          onToggle={() => {
            /* Closing it takes the words with it. */
            if (showOther) {
              setOtherOpen(false)
              onOther('')
            } else {
              setOtherOpen(true)
              /* One answer only: their own words replace a chosen photograph. */
              if (single) chosen.forEach(onToggle)
            }
          }}
        />
      </div>
      <OtherField
        id="fy-other"
        open={showOther}
        value={other}
        placeholder={otherPlaceholder}
        onChange={onOther}
      />
    </div>
  )
}

/* How far away: a road, and her pin travels along it to the band chosen. */
export function Road({
  value,
  onChange,
  onSettle,
  still,
  stops = WHEN,
  title,
  sub,
}: {
  value: string | null
  onChange?: (v: string) => void
  /** The stop the pin was let go on — the answer given, where `onChange`
      follows the pin as it slides past each stop. */
  onSettle?: (v: string) => void
  /** On the ending: the road as she left it, not a question. */
  still?: boolean
  stops?: string[]
  title?: string
  sub?: string
}) {
  const at = value ? stops.indexOf(value) : -1
  /* The pin can be taken hold of and slid along the road — or the road
     pressed anywhere — and it snaps to the nearest stop as it goes. */
  const road = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const stopAt = (clientX: number) => {
    const r = road.current?.getBoundingClientRect()
    if (!r || !r.width) return 0
    const k = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    return Math.round(k * (stops.length - 1))
  }
  const onDown = (e: React.PointerEvent) => {
    if (still || !onChange || e.button !== 0) return
    e.preventDefault()
    setDragging(true)
    let last = stopAt(e.clientX)
    onChange(stops[last])
    const move = (ev: PointerEvent) => {
      const i = stopAt(ev.clientX)
      if (i !== last) {
        last = i
        onChange(stops[i])
      }
    }
    const up = () => {
      setDragging(false)
      onSettle?.(stops[last])
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
          <h2 className="fy-h">{title}</h2>
          <p className="fy-sub">{sub}</p>
        </>
      )}
      <div
        ref={road}
        className={`fy-road${dragging ? ' is-dragging' : ''}`}
        style={{ ['--at' as string]: Math.max(0, at), ['--n' as string]: stops.length - 1 }}
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
          {stops.map((w, i) => (
            <button
              key={w}
              type="button"
              className={`fy-stop${i === at ? ' is-on' : ''}${i < at ? ' is-past' : ''}`}
              aria-pressed={i === at}
              disabled={still}
              onClick={(e) => {
                onChange?.(w)
                /* From the keyboard there was no pointer to let go of. */
                if (e.detail === 0) onSettle?.(w)
              }}
            >
              <i />
              {/* "year" or "years" on a line of its own, so every stop reads
                  as two even lines rather than breaking wherever it falls. */}
              <span>
                {(() => {
                  const m = w.match(/^(.*\S)\s+(years?)$/i)
                  return m ? (
                    <>
                      {m[1]}
                      <br />
                      {m[2]}
                    </>
                  ) : (
                    w
                  )
                })()}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* Drawn icons a kind can name instead of a glyph: what you own is a key, your
   clients a handshake. Anything else is shown as the character it is. */
const GROUP_ICONS: Record<string, JSX.Element> = {
  key: (
    <>
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </>
  ),
  handshake: (
    <>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
      <path d="M3 4h8" />
    </>
  ),
  people: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  plane: (
    <>
      <path d="M2 22h20" />
      <path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.46-.6.84-1.07 1.08L7.58 17.2a2 2 0 0 1-1.22.18Z" />
    </>
  ),
}
const GroupIcon = ({ icon }: { icon: string }) =>
  GROUP_ICONS[icon] ? (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {GROUP_ICONS[icon]}
    </svg>
  ) : (
    <>{icon}</>
  )

/* The detail: five kinds, each with its own and a way to add theirs. */
function Detail({
  chosen,
  onToggle,
  extra,
  onAdd,
  content,
}: {
  chosen: string[]
  onToggle: (v: string) => void
  extra: Record<string, string[]>
  onAdd: (group: string, v: string) => void
  content: FutureYouContent['detail']
}) {
  const [adding, setAdding] = useState<string | null>(null)
  const [text, setText] = useState('')
  /* Each kind in its own colour, and what is picked in it — the tally at the
     top gains a dot of that colour for every pick. */
  const groups = content.groups.map((d, gi) => {
    const items = [...d.items, ...(extra[d.group] ?? [])]
    return { ...d, tone: gi % 5, items, picked: items.filter((it) => chosen.includes(it)) }
  })
  const total = groups.reduce((n, d) => n + d.picked.length, 0)
  /* One kind at a time, each added under the ones before, which stay. Coming
     back to the screen opens as far as the last kind with a pick in it. */
  const [shown, setShown] = useState(() => {
    let last = 0
    groups.forEach((d, i) => {
      if (d.picked.length) last = i
    })
    return last + 1
  })
  const newest = useRef<HTMLElement>(null)
  const revealed = useRef(false)
  useEffect(() => {
    if (!revealed.current) return
    const t = window.setTimeout(() => newest.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)
    return () => window.clearTimeout(t)
  }, [shown])
  const next = groups[shown]
  return (
    <div className="fy-detail">
      <h2 className="fy-h fy-h-sm">{content.title}</h2>
      <p className="fy-sub">{content.sub}</p>
      <div className={`fy-tally${total ? ' has-some' : ''}`} aria-live="polite">
        <span className="fy-tally-dots" aria-hidden>
          {groups.flatMap((d) => d.picked.map((it) => <i key={it} className="fy-dot" data-tone={d.tone} />))}
        </span>
        <span className="fy-tally-text">
          {total ? (
            <>
              <b key={total} className="fy-tally-n">
                {total}
              </b>{' '}
              picked
            </>
          ) : (
            'Nothing picked yet'
          )}
        </span>
      </div>
      {groups.slice(0, shown).map((d, gi) => (
        <section
          className="fy-group"
          key={d.group}
          ref={gi === shown - 1 ? newest : undefined}
          data-tone={d.tone}
          style={{ ['--g' as string]: revealed.current ? 0 : gi }}
        >
          <h3>
            <span className="fy-group-icon" aria-hidden>
              <GroupIcon icon={d.icon} />
            </span>
            <span className="fy-group-name">{d.group}</span>
            {d.picked.length > 0 && (
              <span key={d.picked.length} className="fy-group-n">
                {d.picked.length}
              </span>
            )}
          </h3>
          <div className="fy-chips">
            {d.items.map((it) => (
              <button
                key={it}
                type="button"
                className={`fy-chip${chosen.includes(it) ? ' is-on' : ''}`}
                aria-pressed={chosen.includes(it)}
                onClick={() => onToggle(it)}
              >
                <span className="fy-chip-check" aria-hidden>
                  <svg viewBox="0 0 12 12" width="12" height="12">
                    <path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
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
      {next && (
        <button
          key={next.group}
          type="button"
          className="fy-next-group"
          data-tone={next.tone}
          onClick={() => {
            revealed.current = true
            setShown((s) => s + 1)
          }}
        >
          <span className="fy-next-icon" aria-hidden>
            <GroupIcon icon={next.icon} />
          </span>
          <span className="fy-next-text">
            Next: <b>{next.group}</b>
          </span>
          <span className="fy-next-arrow" aria-hidden>
            →
          </span>
        </button>
      )}
    </div>
  )
}

/* How clear the picture was: five stops, from blurry to vivid, the chosen one
   in focus and the ones before it filling in. */
function Clarity({
  value,
  onChange,
  content,
}: {
  value: number | null
  onChange: (n: number) => void
  content: NonNullable<FutureYouContent['clarity']>
}) {
  return (
    <div className="fy-clarity">
      {/* On a card of its own in the middle of the screen, the way
          Confidence asks its statements. */}
      <div className="fy-clarity-card">
      <span className="fy-clarity-count">Clarity check</span>
      <h2 className="fy-clarity-q">{content.title}</h2>
      {content.sub && <p className="fy-sub">{content.sub}</p>}
      <div className="fy-clarity-row" role="radiogroup" aria-label={content.title}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            className={`fy-clarity-dot${value === n ? ' is-on' : ''}${value !== null && n < value ? ' is-past' : ''}`}
            style={{ ['--blur' as string]: `${(5 - n) * 1.2}px` }}
            onClick={() => onChange(n)}
          >
            <b className="fy-clarity-orb" aria-hidden>
              <i />
            </b>
            <span>{n}</span>
          </button>
        ))}
      </div>
      <div className="fy-clarity-ends">
        <span>{content.low}</span>
        <span>{content.high}</span>
      </div>
      </div>
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
  content,
  below,
}: {
  text: string
  onChange: (v: string) => void
  onSample: () => void
  stamped: boolean
  sent?: boolean
  content: FutureYouContent['postcard']
  below?: ReactNode
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
      <h2 className="fy-h fy-h-sm">{content.title}</h2>
      <p className="fy-sub">{content.sub}</p>
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
          placeholder={content.placeholder}
          onChange={(e) => onChange(e.target.value)}
          onDoubleClick={(e) => {
            if (!e.currentTarget.value.trim()) onSample()
          }}
        />
      </div>
      {below}
    </div>
  )
}

type Step =
  | 'intro'
  | 'breathe'
  | 'where'
  | 'doing'
  | 'with'
  | 'when'
  | 'detail'
  | 'clarity'
  | 'postcard'
  | 'results'
  | 'badge'

type Reward = { before: number; after: number; total: number; next: string; card?: ReactNode; idName?: string }

export default function FutureYouFlow({
  reward,
  onComplete,
  review,
  content = CLIENT_FUTURE,
  postcardSlot,
}: {
  reward: Reward | ((a: FutureYouAnswers) => Reward)
  onComplete: (a: FutureYouAnswers) => void
  review?: FutureYouAnswers
  content?: FutureYouContent
  /** What a caller adds under the postcard — the advisor's microphone. */
  postcardSlot?: (text: string, set: (v: string) => void) => ReactNode
}) {
  const QUESTIONS: Step[] = [
    'breathe',
    'where',
    'doing',
    'with',
    'when',
    'detail',
    ...(content.clarity ? (['clarity'] as Step[]) : []),
    'postcard',
  ]
  const [step, setStep] = useState<Step>(review ? 'results' : 'intro')
  const [a, setA] = useState<FutureYouAnswers>(
    () => review ?? { where: [], doing: [], with: [], when: null, detail: [], postcard: '', clarity: null },
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

  /* A one-tap answer moves on by itself, after the beat it takes to see the
     choice land — the same beat as The Move's. A step changed any other way
     (Back, OK) cancels one still waiting. */
  const auto = useRef(0)
  useEffect(() => {
    document.querySelector('.cx-viewport')?.scrollTo({ top: 0 })
    return () => window.clearTimeout(auto.current)
  }, [step])

  const toggle = (key: 'where' | 'doing' | 'with' | 'detail', v: string) =>
    setA((p) => {
      if (key !== 'detail' && content.ask[key].single)
        return { ...p, [key]: p[key].includes(v) ? [] : [v] }
      return { ...p, [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v] }
    })

  const writeSample = () => {
    window.clearInterval(typing.current)
    const full = content.sample.postcard
    let n = 0
    typing.current = window.setInterval(() => {
      n = Math.min(full.length, n + 4)
      setA((p) => ({ ...p, postcard: full.slice(0, n) }))
      if (n >= full.length) window.clearInterval(typing.current)
    }, 16)
  }

  const qi = QUESTIONS.indexOf(step)
  const withOther = (key: AskKey) => (other[key]?.trim() ? [...a[key], other[key].trim()] : a[key])

  /* Nothing given on this screen yet. Without samples to fall back on, the
     button says what pressing it does. */
  const blank =
    ((step === 'where' || step === 'doing' || step === 'with') && !withOther(step).length) ||
    (step === 'when' && !a.when) ||
    (step === 'detail' && !a.detail.length) ||
    (step === 'clarity' && !a.clarity) ||
    (step === 'postcard' && !a.postcard.trim())
  const skipping = blank && !content.fill

  const onOk = () => {
    /* Left blank: the sample goes in, so a demo still arrives at a vision. */
    if (content.fill) {
      const s = content.sample
      if (step === 'where' && !withOther('where').length) setA((p) => ({ ...p, where: s.where }))
      if (step === 'doing' && !withOther('doing').length) setA((p) => ({ ...p, doing: s.doing }))
      if (step === 'with' && !withOther('with').length) setA((p) => ({ ...p, with: s.with }))
      if (step === 'when' && !a.when) setA((p) => ({ ...p, when: s.when }))
      if (step === 'detail' && !a.detail.length) setA((p) => ({ ...p, detail: s.detail }))
      if (step === 'clarity' && !a.clarity) setA((p) => ({ ...p, clarity: s.clarity ?? null }))
    }
    if (step === 'postcard') {
      window.clearInterval(typing.current)
      if (content.fill && !a.postcard.trim()) setA((p) => ({ ...p, postcard: content.sample.postcard }))
      const settle = () =>
        setA((p) => ({
          ...p,
          where: withOther('where'),
          doing: withOther('doing'),
          with: withOther('with'),
        }))
      /* A card left blank by somebody answering is not posted: straight on
         to the ending, without the stamp. */
      if (!content.fill && !a.postcard.trim()) {
        settle()
        setStep('results')
        return
      }
      /* Posted: the postmark lands, the card goes off to the right as if it
         had been dropped in the box, then the ending. */
      setStamped(true)
      window.setTimeout(() => setSent(true), 750)
      window.setTimeout(() => {
        settle()
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
  /* The OK of the latest render, for a timer set before the answer it moves
     on from had landed. */
  const okLatest = useRef(onOk)
  okLatest.current = onOk

  const pools: Record<AskKey, Pick[]> = {
    where: content.ask.where.options,
    doing: content.ask.doing.options,
    with: content.ask.with.options,
  }
  const about = content.results.about(a)
  const rewardNow = typeof reward === 'function' ? reward(a) : reward
  const postcardText = a.postcard || (content.fill ? content.sample.postcard : '')

  return (
    <div className="jf fy">
      {step === 'intro' && (
        <div className="jf-intro">
          <div className="jf-hero">
            <Photo className="jf-hero-img" src={content.intro.image} fallback="fy-hero-fallback" />
          </div>
          <h2 className="jf-title">{content.intro.title}</h2>
          <p className="jf-body">{content.intro.body}</p>
          {content.intro.gets && <IntroGets gets={content.intro.gets} />}
          <div className="jf-start">
            <button className="jf-go" type="button" onClick={() => setStep('breathe')}>
              Get Started
            </button>
            <span className="jf-min">
              <ClockIcon /> Takes {content.intro.minutes} min
            </span>
          </div>
        </div>
      )}

      {step === 'breathe' && <Breathe {...content.breathe} />}

      {(step === 'where' || step === 'doing' || step === 'with') && (
        <PhotoAsk
          key={step}
          title={content.ask[step].title}
          sub={content.ask[step].sub}
          options={content.ask[step].options}
          single={content.ask[step].single}
          chosen={a[step]}
          other={other[step] ?? ''}
          otherPlaceholder={content.ask[step].otherPlaceholder}
          onToggle={(v) => {
            const picking = !a[step].includes(v)
            toggle(step, v)
            if (content.ask[step].single && picking) {
              window.clearTimeout(auto.current)
              auto.current = window.setTimeout(() => okLatest.current(), 560)
            }
          }}
          onOther={(v) => setOther((o) => ({ ...o, [step]: v }))}
        />
      )}
      {step === 'when' && (
        <Road
          value={a.when}
          stops={content.when.stops}
          title={content.when.title}
          sub={content.when.sub}
          onChange={(v) => setA((p) => ({ ...p, when: v }))}
          onSettle={() => {
            window.clearTimeout(auto.current)
            auto.current = window.setTimeout(() => okLatest.current(), 560)
          }}
        />
      )}
      {step === 'detail' && (
        <Detail
          content={content.detail}
          chosen={a.detail}
          onToggle={(v) => toggle('detail', v)}
          extra={extra}
          onAdd={(g, v) => {
            setExtra((e) => ({ ...e, [g]: [...(e[g] ?? []), v] }))
            setA((p) => ({ ...p, detail: [...p.detail, v] }))
          }}
        />
      )}
      {step === 'clarity' && content.clarity && (
        <Clarity
          content={content.clarity}
          value={a.clarity ?? null}
          onChange={(n) => {
            setA((p) => ({ ...p, clarity: n }))
            window.clearTimeout(auto.current)
            auto.current = window.setTimeout(() => okLatest.current(), 560)
          }}
        />
      )}
      {step === 'postcard' && (
        <Postcard
          content={content.postcard}
          text={a.postcard}
          onChange={(v) => setA((p) => ({ ...p, postcard: v }))}
          onSample={writeSample}
          stamped={stamped}
          sent={sent}
          below={postcardSlot?.(a.postcard, (v) => setA((p) => ({ ...p, postcard: v })))}
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
              title={about.title}
              share={about.share}
              onClose={ending.close}
              first={about.first}
              second={about.second}
            />
          )}
          <Reveal>
            <h2 className="jr-title">{content.results.title}</h2>
            <p className="jr-sub">{content.results.sub}</p>
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
                    ['Where', a.where, pools.where],
                    ['Doing', a.doing, pools.doing],
                    ['With', a.with, pools.with],
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
                    <Road value={a.when} stops={content.when.stops} still />
                  </div>
                )}
              </div>
            </figure>
          </Reveal>

          {a.detail.length > 0 && (
            <Reveal>
              <h3 className="jr-h">{content.results.detailTitle}</h3>
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
            {postcardText && (
              <>
                <h3 className="jr-h">Your postcard</h3>
                <p className="jr-sub">{content.results.postcardSub}</p>
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
                    {postcardText}
                  </p>
                </ArrivingCard>
              </>
            )}
            {(content.fill || a.where.length > 0) && (
              <p className="jr-reading">
                <span className="jr-reading-mark" aria-hidden>
                  ✦
                </span>
                {content.results.line(a)}
              </p>
            )}
          </Reveal>

          <Reveal className="jr-reward">
            {content.badge && <p className="jr-reward-line">You got a reward!</p>}
            <button
              className="jr-claim"
              type="button"
              onClick={() => (content.badge ? setStep('badge') : onComplete(a))}
            >
              <span>{content.badge ? 'Claim Badge' : 'Continue'}</span>
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

      {step === 'badge' && content.badge && (
        <JoyReward
          badge={content.badge}
          name={content.badgeName}
          from={rewardNow.before}
          done={rewardNow.after}
          total={rewardNow.total}
          next={rewardNow.next}
          card={rewardNow.card}
          idName={rewardNow.idName}
          onNext={() => onComplete(a)}
        />
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
          <button
            className={`cx-start jf-ok${skipping ? ' is-skip' : ''}`}
            type="button"
            onClick={onOk}
            disabled={stamped}
          >
            {skipping ? 'Skip this question' : step === 'postcard' ? 'Send' : 'OK'}
          </button>
        </div>
        </>
      )}
    </div>
  )
}
