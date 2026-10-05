/* The account step, mocked on Knomee's own sign-in card (app.knomee.com):
   white card on mint, the wordmark, Google first, then an email.

   It stands in front of the Business / Financial ID. The answers have already
   gone to the advisor or firm by the time it shows; what signing up buys is
   the person's own copy of the page. Leaving it is allowed — they go back to
   their adventures and the ID stays closed.

   Nothing here creates an account or sends the address anywhere but onto
   this person's own sheet: it is a prototype of the step, not the step. */

import { useState } from 'react'
import './signUp.css'

export default function SignUpScreen({
  idName,
  onDone,
  onClose,
}: {
  /** "Business ID" or "Financial ID" — what signing up opens. */
  idName: string
  /** Signed up: with the address they typed, or none by Google (mocked). */
  onDone: (email?: string) => void
  /** Not now: back to the adventures, the ID still closed. */
  onClose: () => void
}) {
  const [email, setEmail] = useState('')
  const valid = /^\S+@\S+\.\S+$/.test(email.trim())
  return (
    <div className="su">
      <div className="su-card">
        <img className="su-logo" src="./knomee-logo-plum.svg" alt="knomee" />
        <h2 className="su-title">Create Your Account</h2>
        <p className="su-sub">Sign up to see your {idName} — and keep it.</p>

        <button className="su-google" type="button" onClick={() => onDone()}>
          <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          Continue with Google
        </button>

        <div className="su-or">
          <span>or</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (valid) onDone(email.trim())
          }}
        >
          <label className="su-label" htmlFor="su-email">
            Email address
          </label>
          <input
            id="su-email"
            className="su-input"
            type="email"
            autoComplete="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="su-continue" type="submit" disabled={!valid}>
            Continue
            <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden>
              <path d="M2 1l6 4-6 4z" fill="currentColor" />
            </svg>
          </button>
        </form>
      </div>

      <p className="su-terms">
        By creating an account, you accept Knomee’s <u>Terms of Service</u> and <u>Privacy Policy</u>
      </p>
      <button className="su-later" type="button" onClick={onClose}>
        Not Now
      </button>
    </div>
  )
}
