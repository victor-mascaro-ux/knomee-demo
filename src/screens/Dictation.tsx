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
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

export function speechCtor(): (new () => Recognition) | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function useDictation(onFinal: (text: string) => void) {
  const Ctor = speechCtor()
  const [on, setOn] = useState(false)
  const rec = useRef<Recognition | null>(null)
  const cb = useRef(onFinal)
  cb.current = onFinal
  useEffect(() => () => rec.current?.stop(), [])
  const toggle = () => {
    if (!Ctor) return
    if (on) {
      rec.current?.stop()
      return
    }
    const r = new Ctor()
    r.continuous = true
    r.interimResults = false
    r.lang = navigator.language || 'en-US'
    r.onresult = (e) => {
      for (let n = e.resultIndex; n < e.results.length; n++) {
        const res = e.results[n]
        if (res.isFinal) cb.current(res[0].transcript.trim())
      }
    }
    r.onend = () => setOn(false)
    r.onerror = () => setOn(false)
    rec.current = r
    try {
      r.start()
      setOn(true)
    } catch {
      setOn(false)
    }
  }
  return { supported: !!Ctor, on, toggle }
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
    there. Nothing at all where the browser cannot listen. */
export function MicButton({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const latest = useRef(value)
  latest.current = value
  const mic = useDictation((heard) => {
    if (!heard) return
    const had = latest.current.trim()
    const next = had ? `${had} ${heard}` : heard.charAt(0).toUpperCase() + heard.slice(1)
    latest.current = next
    onChange(next)
  })
  if (!mic.supported) return null
  return (
    <button
      type="button"
      className={`af-mic${mic.on ? ' is-on' : ''}`}
      aria-pressed={mic.on}
      onClick={mic.toggle}
    >
      {mic.on ? <i className="af-mic-dot" aria-hidden /> : <MicIcon />}
      {mic.on ? 'Listening… tap to stop' : 'Say your answer'}
    </button>
  )
}
