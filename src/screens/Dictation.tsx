/* The microphone under a free-text box, shared by every flow that has one —
 * the advisor's questions and the client's adventures — so it is the same
 * button, with the same behaviour, wherever somebody is asked to write.
 */

import { useEffect, useRef, useState } from 'react'
import './dictation.css'

/* Speaking a long answer is easier than typing it on a phone. The browser's own
   speech recognition, where it has one (Chrome, Safari, Edge); where it does
   not, the button is simply not there and the keyboard's dictation still is. */
interface Recognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult:
    | ((e: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string; confidence: number } }> }) => void)
    | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
}

export function speechCtor(): (new () => Recognition) | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

/* Pieces of speech arrive with or without their own spaces; one space apart. */
const joinSaid = (...parts: string[]) =>
  parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' ')

/* Chrome on Android hands each settled phrase over twice, the copy with no
   confidence at all; counting it would write everything said twice. */
const ANDROID = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)

/** Listens until it is told to stop, and passes on everything heard so far
    each time it hears more — the settled words and the ones it is still
    guessing at — so the words appear while they are said, the way dictation
    does, rather than all at once when the person stops. */
export function useDictation(onHeard: (text: string) => void) {
  const Ctor = speechCtor()
  const [on, setOn] = useState(false)
  const rec = useRef<Recognition | null>(null)
  // The person has not pressed stop: a pause that ends the browser's
  // listening is not the end of what they are saying.
  const wanted = useRef(false)
  const cb = useRef(onHeard)
  cb.current = onHeard

  /* Stops at once and drops whatever was still on its way in. */
  const cancel = () => {
    wanted.current = false
    const r = rec.current
    rec.current = null
    r?.abort()
    setOn(false)
  }
  useEffect(() => cancel, [])

  /* One stretch of listening. `kept` is what earlier stretches heard. */
  const listen = (Rec: new () => Recognition, kept: string) => {
    const r = new Rec()
    r.continuous = true
    r.interimResults = true
    r.lang = navigator.language || 'en-US'
    // By position, and read afresh every time, so a phrase that firms up
    // replaces its guess rather than following it.
    const settled: string[] = []
    let guess = ''
    let failed = false
    r.onresult = (e) => {
      if (rec.current !== r) return
      guess = ''
      for (let n = 0; n < e.results.length; n++) {
        const res = e.results[n]
        if (!res.isFinal) guess = joinSaid(guess, res[0].transcript)
        else if (!(ANDROID && res[0].confidence === 0)) settled[n] = res[0].transcript
      }
      cb.current(joinSaid(kept, ...settled.filter(Boolean), guess))
    }
    // Silence is not a reason to stop listening; being refused the mic is.
    r.onerror = (e) => {
      if (e.error !== 'no-speech') failed = true
    }
    r.onend = () => {
      if (rec.current !== r) return
      if (wanted.current && !failed) {
        try {
          listen(Rec, joinSaid(kept, ...settled.filter(Boolean), guess))
          return
        } catch {
          /* it would not start again: stop below */
        }
      }
      rec.current = null
      wanted.current = false
      setOn(false)
    }
    rec.current = r
    r.start()
  }

  const toggle = () => {
    if (!Ctor) return
    if (on) {
      // Ends listening; the last guess firms up in place and stays.
      wanted.current = false
      rec.current?.stop()
      return
    }
    wanted.current = true
    try {
      listen(Ctor, '')
      setOn(true)
    } catch {
      rec.current = null
      wanted.current = false
      setOn(false)
    }
  }
  return { supported: !!Ctor, on, toggle, cancel }
}

function MicIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="5.5" y="1.8" width="5" height="8" rx="2.5" />
      <path d="M3.2 7.6a4.8 4.8 0 009.6 0M8 12.4v2" strokeLinecap="round" />
    </svg>
  )
}

/** The microphone under a free-text box: what is said is added to what is
    there, word by word as it is said. Nothing at all where the browser cannot
    listen. */
export function MicButton({
  value,
  onChange,
  big = false,
}: {
  value: string
  onChange: (v: string) => void
  /** The memory screen's version: full width, "Tell it instead", and a sound
      wave that moves while it listens. */
  big?: boolean
}) {
  // What was in the box when they started talking. Everything heard follows
  // it, and the whole is written again each time more is heard.
  const before = useRef(value)
  // Every version of the box the microphone has written. One that is none of
  // them was typed: typing takes over from listening.
  const wrote = useRef(new Set<string>())
  const mic = useDictation((heard) => {
    if (!heard) return
    const had = before.current.trim()
    const next = had ? `${had} ${heard}` : heard.charAt(0).toUpperCase() + heard.slice(1)
    wrote.current.add(next)
    onChange(next)
  })
  useEffect(() => {
    if (!mic.on || value === before.current || wrote.current.has(value)) return
    if (wrote.current.size) mic.cancel()
    else before.current = value
  }, [value, mic.on])
  if (!mic.supported) return null
  const toggle = () => {
    if (!mic.on) {
      before.current = value
      wrote.current = new Set()
    }
    mic.toggle()
  }
  if (big)
    return (
      <button
        type="button"
        className={`af-mic af-mic-big${mic.on ? ' is-on' : ''}`}
        aria-pressed={mic.on}
        onClick={toggle}
      >
        <MicIcon />
        <span>{mic.on ? 'Listening… Tap to Stop' : 'Tell It Instead'}</span>
        {/* The sound wave: still bars at rest, moving while it listens. */}
        <span className="af-wave" aria-hidden>
          {Array.from({ length: 7 }, (_, i) => (
            <i key={i} style={{ ['--i' as string]: i }} />
          ))}
        </span>
      </button>
    )
  return (
    <button
      type="button"
      className={`af-mic${mic.on ? ' is-on' : ''}`}
      aria-pressed={mic.on}
      onClick={toggle}
    >
      {mic.on ? <i className="af-mic-dot" aria-hidden /> : <MicIcon />}
      {mic.on ? 'Listening… Tap to Stop' : 'Say Your Answer'}
    </button>
  )
}
