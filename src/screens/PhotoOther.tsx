/* "Other", as a tile in a grid of photographs.
 *
 * The photo questions — Financial Joy's and Practice Joy's picks, Future You's
 * where, doing and who with — used to end in a separate "Other" label and a
 * field under the grid. Now the grid itself has the way to say something
 * else: a square like the others, wearing a pencil, which opens a field under
 * the grid when tapped and closes it (and clears it) when tapped again. It
 * wears the same lime ring as a chosen photograph once there are words in it.
 */

import { useEffect, useRef } from 'react'

const Pencil = () => (
  <svg viewBox="0 0 32 32" width="34" height="34" fill="none" aria-hidden>
    <path
      d="M21.6 5.6a3 3 0 0 1 4.2 4.2L12.2 23.4l-5.6 1.4 1.4-5.6L21.6 5.6Z"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path d="M19.4 7.8l4.8 4.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

export function OtherTile({
  open,
  filled,
  disabled,
  onToggle,
}: {
  open: boolean
  /** There are words in the field: it is an answer, and wears the ring. */
  filled: boolean
  /** The question's limit is reached and this is not one of the answers. */
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className={`jf-photo jf-photo-other${filled ? ' is-on' : ''}${open ? ' is-open' : ''}${disabled ? ' is-full' : ''}`}
      aria-pressed={open}
      aria-expanded={open}
      aria-disabled={disabled}
      onClick={() => !disabled && onToggle()}
    >
      <span className="jf-photo-frame">
        <span className="jf-other-tile">
          <Pencil />
        </span>
      </span>
      <span className="jf-photo-label">Other</span>
    </button>
  )
}

/** The field the tile opens, under the grid. It takes the focus as it opens. */
export function OtherField({
  open,
  value,
  placeholder,
  onChange,
  id,
}: {
  open: boolean
  value: string
  placeholder: string
  onChange: (v: string) => void
  id: string
}) {
  const box = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (open) box.current?.focus()
  }, [open])
  if (!open) return null
  return (
    <div className="jf-other-open">
      <label className="jf-other-label" htmlFor={id}>
        Your own answer
      </label>
      <input
        ref={box}
        id={id}
        className="jf-other"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
