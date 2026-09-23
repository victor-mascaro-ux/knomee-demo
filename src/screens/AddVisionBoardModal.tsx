/* Making a future vision board, from the phone.
 *
 * "Save a vision" on the quick sheet went nowhere, because a vision board is
 * pictures and there was nowhere on the phone to put one. This is where it
 * goes: two steps in the app's own modal, the way a goal or a life event is
 * added.
 *
 * First the board's name, and a line about it if they want one. Then the board
 * itself, built three ways — words they type, photographs off their phone, and
 * words they say, which land as a written sticker so the board stays a thing
 * you read at a glance rather than a list of recordings. What they are making
 * is drawn as they make it, by the same Board the advisor's page draws, so the
 * preview is the board and not a picture of one.
 *
 * The voice is scripted, like the long-press capture: the point is the shape
 * of it, and a demo in a room has to say the same thing every time.
 */

import { useEffect, useRef, useState } from 'react'
import './addVisionBoardModal.css'
import { clientProfile, type BoardTile, type VisionBoard } from '../data/clientProfile'
import { CloseIcon } from '../components/icons'
import { Board, type TileSize } from './ClientProfileScreen'

/* The pictures on Emily's Future Vision Board, offered as the library to pick
   from: a demo in a room has no camera roll, and these are the photographs the
   prototype already has. Her own phone's upload stays at the end of the row. */
const LIBRARY = clientProfile.boards.flatMap((b) =>
  b.tiles.flatMap((t) => (t.kind === 'photo' ? [{ src: t.src, alt: t.alt }] : [])),
)

type NoteTile = Extract<BoardTile, { kind: 'note' }>
type Tone = NoteTile['tone'] | undefined

/* What she "says". Streamed a word at a time, then hers to edit. */
const SPOKEN =
  'A porch by the ocean, the kids home every summer, and time to paint in the mornings.'
const WORD_MS = 190
const FIRST_WORD_MS = 700

/* The two papers the authored boards are written on. */
const TONES: { id: Tone; label: string }[] = [
  { id: 'mint', label: 'Mint' },
  { id: 'lilac', label: 'Lilac' },
]

const MicIcon = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 20 20" width={size} height={size} fill="none" aria-hidden>
    <rect x="7" y="2.5" width="6" height="10" rx="3" fill="currentColor" />
    <path
      d="M4.6 9.6a5.4 5.4 0 0 0 10.8 0M10 15v2.6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)
const PhotoIcon = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden>
    <rect x="2.6" y="4" width="14.8" height="12" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="7.2" cy="8.3" r="1.5" fill="currentColor" />
    <path
      d="m3.4 14.4 4-3.8 2.8 2.5 2.6-2.2 3.8 3.4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
)
const TextIcon = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden>
    <path
      d="M4 5h12M10 5v11M7.4 16h5.2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)
/* The composer under the board: nothing open, typing, or listening. */
type Mode = null | 'text' | 'voice' | 'photo'

export default function AddVisionBoardModal({
  board,
  onClose,
  onSave,
  onDelete,
}: {
  /** A board already on the page, opened to be changed. It opens on the board
      itself — they are changing what is on it — and Back still renames it. */
  board?: VisionBoard
  onClose: () => void
  onSave: (board: VisionBoard) => void
  /** Offered only on a board that exists. */
  onDelete?: () => void
}) {
  const [named, setNamed] = useState(!!board)
  const [title, setTitle] = useState(board?.title ?? '')
  const [blurb, setBlurb] = useState(board?.blurb ?? '')
  const [tiles, setTiles] = useState<BoardTile[]>(board?.tiles ?? [])
  const [mode, setMode] = useState<Mode>(null)
  const photoInput = useRef<HTMLInputElement>(null)
  /* Asking whether to leave a board that has not been saved. */
  const [leaving, setLeaving] = useState(false)

  /* Anything different from what was opened is work that would be lost. */
  const dirty =
    title !== (board?.title ?? '') ||
    blurb !== (board?.blurb ?? '') ||
    tiles !== (board?.tiles ?? tiles) ||
    (!board && tiles.length > 0)
  /* Every way out — the backdrop, the cross, Escape, Cancel — asks first when
     there is something to lose, and simply closes when there is not. */
  const requestClose = () => (dirty ? setLeaving(true) : onClose())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Escape on the question is "go back", not a second way out.
      if (leaving) setLeaving(false)
      else requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const add = (t: BoardTile) => {
    setTiles((ts) => [...ts, t])
    setMode(null)
  }

  /* A photograph takes one cell. The board stretches whatever ends it across
     an empty last row, but it cannot fill the hole beside a tall tile that
     nothing follows — and on a board being built, the newest tile is always
     the last one. */
  const addPhotos = (files: FileList | null) => {
    if (!files) return
    const photos = Array.from(files).filter((f) => f.type.startsWith('image/'))
    setTiles((ts) => [
      ...ts,
      ...photos.map(
        (f): BoardTile => ({
          kind: 'photo',
          src: URL.createObjectURL(f),
          alt: f.name.replace(/\.[^.]+$/, ''),
        }),
      ),
    ])
    setMode(null)
  }

  /* A photograph dragged to a size: one cell, two across, or two down. */
  const resize = (i: number, size: TileSize) =>
    setTiles((ts) =>
      ts.map((t, j) =>
        j === i && t.kind === 'photo'
          ? { ...t, wide: size === '2x1' || undefined, tall: size === '1x2' || undefined }
          : t,
      ),
    )

  const save = () => {
    const name = title.trim()
    if (!name || tiles.length === 0) return
    onSave({ title: name, blurb: blurb.trim(), tiles })
  }

  return (
    <div className="modal-backdrop" onClick={requestClose} role="dialog" aria-modal="true">
      <div className="modal vb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{board ? 'Edit Vision Board' : 'Future Vision Board'}</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={requestClose}>
            <CloseIcon />
          </button>
        </div>

        {!named ? (
          <>
            <div className="modal-body vb-body">
              <h3 className="vb-step-title">Name your vision</h3>
              <p className="vb-step-note">
                A board is the future you are saving for, in pictures and in your own words.
              </p>
              <label className="vb-label" htmlFor="vb-title">
                Board name
              </label>
              <input
                id="vb-title"
                className="vb-input"
                value={title}
                autoFocus
                placeholder="e.g. Life by the coast"
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && title.trim()) setNamed(true)
                }}
              />
              <label className="vb-label" htmlFor="vb-blurb">
                What it is about <i>· optional</i>
              </label>
              <input
                id="vb-blurb"
                className="vb-input"
                value={blurb}
                placeholder="A line to read it by"
                onChange={(e) => setBlurb(e.target.value)}
              />
            </div>
            <div className="modal-footer vb-foot">
              <button className="btn btn-outline" type="button" onClick={requestClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={!title.trim()}
                onClick={() => setNamed(true)}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-body vb-body vb-board-area">
              {/* The board's own name heads what is being made — a step under
                  the panel's title, and the preview below drops its copy. */}
              <h3 className="vb-board-name">{title.trim()}</h3>
              {blurb.trim() && <p className="vb-board-blurb">{blurb.trim()}</p>}
              {tiles.length > 0 && (
                <div className="vb-preview">
                  <Board
                    board={{ title: title.trim(), blurb: blurb.trim(), tiles }}
                    onResize={resize}
                    onRemove={(i) => setTiles((ts) => ts.filter((_, j) => j !== i))}
                    onMove={(from, to) =>
                      setTiles((ts) => {
                        const next = [...ts]
                        const [t] = next.splice(from, 1)
                        next.splice(to, 0, t)
                        return next
                      })
                    }
                  />
                </div>
              )}

            </div>

            {/* The ways in stay put under the board, whatever it has grown to:
                the body above scrolls, this does not. A composer opens here
                too, in their place. */}
            <div className="vb-dock">
              {mode === 'text' && <TextComposer onAdd={add} onCancel={() => setMode(null)} />}
              {mode === 'voice' && <VoiceComposer onAdd={add} onCancel={() => setMode(null)} />}
              {mode === 'photo' && (
                <PhotoPicker
                  onAdd={(picked) => {
                    setTiles((ts) => [...ts, ...picked])
                    setMode(null)
                  }}
                  onUpload={() => photoInput.current?.click()}
                  onCancel={() => setMode(null)}
                />
              )}
              <input
                ref={photoInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  addPhotos(e.target.files)
                  e.target.value = ''
                }}
              />

              {mode === null && (
                <div className="vb-adds">
                  <button type="button" className="vb-add" onClick={() => setMode('text')}>
                    <span className="vb-add-ic">
                      <TextIcon />
                    </span>
                    Write
                  </button>
                  <button
                    type="button"
                    className="vb-add"
                    onClick={() => setMode('photo')}
                  >
                    <span className="vb-add-ic">
                      <PhotoIcon />
                    </span>
                    Photo
                  </button>
                  <button type="button" className="vb-add" onClick={() => setMode('voice')}>
                    <span className="vb-add-ic">
                      <MicIcon />
                    </span>
                    Speak
                  </button>
                </div>
              )}
            </div>
            <div className="modal-footer vb-foot">
              {onDelete && (
                <button className="vb-link vb-delete" type="button" onClick={onDelete}>
                  Delete board
                </button>
              )}
              <button className="btn btn-outline" type="button" onClick={() => setNamed(false)}>
                Back
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={tiles.length === 0}
                onClick={save}
              >
                Save board
              </button>
            </div>
          </>
        )}

        {leaving && (
          <div className="vb-leave" role="alertdialog" aria-labelledby="vb-leave-title">
            <div className="vb-leave-card">
              <h3 id="vb-leave-title" className="vb-leave-title">
                Leave without saving?
              </h3>
              <p className="vb-leave-note">
                {board
                  ? 'Your changes to this board won’t be saved.'
                  : 'This board won’t be saved.'}
              </p>
              <div className="vb-leave-acts">
                <button className="btn btn-outline" type="button" onClick={onClose}>
                  Leave without saving
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  autoFocus
                  onClick={() => setLeaving(false)}
                >
                  Go back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* The paper a sticker goes on, for the typed ones and the said ones alike. */
function TonePicker({ tone, onChange }: { tone: Tone; onChange: (t: Tone) => void }) {
  return (
    <div className="vb-tones" role="radiogroup" aria-label="Sticker colour">
      {TONES.map((t) => (
        <button
          key={t.label}
          type="button"
          role="radio"
          aria-checked={tone === t.id}
          aria-label={t.label}
          className={`vb-tone ${t.id ? `is-${t.id}` : ''}${tone === t.id ? ' is-on' : ''}`}
          onClick={() => onChange(t.id)}
        />
      ))}
    </div>
  )
}

/* A sticker, typed: the words, and the paper they go on. */
function TextComposer({ onAdd, onCancel }: { onAdd: (t: BoardTile) => void; onCancel: () => void }) {
  const [text, setText] = useState('')
  const [tone, setTone] = useState<Tone>('mint')
  return (
    <div className="vb-compose">
      <textarea
        className={`vb-note-field ${tone ? `is-${tone}` : ''}`}
        rows={3}
        autoFocus
        value={text}
        placeholder="An affirmation, a promise, a picture in words…"
        onChange={(e) => setText(e.target.value)}
      />
      <div className="vb-compose-foot">
        <TonePicker tone={tone} onChange={setTone} />
        <button className="vb-link" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary vb-small"
          type="button"
          disabled={!text.trim()}
          onClick={() => onAdd({ kind: 'note', text: text.trim(), tone })}
        >
          Add
        </button>
      </div>
    </div>
  )
}

/* A sticker, said: it listens, streams what it heard, and hands the words
   over to be corrected before they go on the board as writing. */
function VoiceComposer({ onAdd, onCancel }: { onAdd: (t: BoardTile) => void; onCancel: () => void }) {
  const words = SPOKEN.split(' ')
  const [heard, setHeard] = useState(0)
  const [text, setText] = useState('')
  const [tone, setTone] = useState<Tone>('lilac')
  const listening = heard < words.length

  useEffect(() => {
    if (!listening) {
      setText(SPOKEN)
      return
    }
    const t = window.setTimeout(() => setHeard((n) => n + 1), heard === 0 ? FIRST_WORD_MS : WORD_MS)
    return () => window.clearTimeout(t)
  }, [heard, listening])

  return (
    <div className="vb-compose vb-voice">
      <div className="vb-voice-head">
        <span className={`vb-mic${listening ? ' is-live' : ''}`}>
          <MicIcon size={20} />
        </span>
        <span className="vb-voice-cap">{listening ? 'Listening…' : 'Here is what I heard'}</span>
        {listening && (
          <span className="vb-wave" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </span>
        )}
      </div>
      {listening ? (
        <p className="vb-heard">
          {words.slice(0, heard).join(' ')}
          <span className="vb-caret" />
        </p>
      ) : (
        <textarea
          className={`vb-note-field ${tone ? `is-${tone}` : ''}`}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}
      <div className="vb-compose-foot">
        {/* Its paper, once there are words to put on it; until then an empty
            slot that holds Cancel and Add to the right. */}
        {listening ? <span className="vb-voice-hint" /> : <TonePicker tone={tone} onChange={setTone} />}
        <button className="vb-link" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary vb-small"
          type="button"
          disabled={listening || !text.trim()}
          onClick={() => onAdd({ kind: 'note', text: text.trim(), tone, voice: true })}
        >
          Add sticker
        </button>
      </div>
    </div>
  )
}

/* Photographs to put on the board: the library, any number of them at once,
   and a way out to her own phone's pictures. */
function PhotoPicker({
  onAdd,
  onUpload,
  onCancel,
}: {
  onAdd: (tiles: BoardTile[]) => void
  onUpload: () => void
  onCancel: () => void
}) {
  const [picked, setPicked] = useState<string[]>([])
  const toggle = (src: string) =>
    setPicked((p) => (p.includes(src) ? p.filter((x) => x !== src) : [...p, src]))
  return (
    <div className="vb-compose">
      <div className="vb-library">
        {LIBRARY.map((ph) => {
          const n = picked.indexOf(ph.src)
          return (
            <button
              key={ph.src}
              type="button"
              className={`vb-pick${n >= 0 ? ' is-on' : ''}`}
              aria-pressed={n >= 0}
              aria-label={ph.alt}
              onClick={() => toggle(ph.src)}
            >
              <img src={ph.src} alt="" draggable={false} />
              {n >= 0 && <span className="vb-pick-n">{n + 1}</span>}
            </button>
          )
        })}
        <button type="button" className="vb-pick vb-pick-upload" onClick={onUpload}>
          <PhotoIcon />
          <span>Upload</span>
        </button>
      </div>
      <div className="vb-compose-foot">
        <span className="vb-voice-hint">
          {picked.length ? `${picked.length} selected` : 'Pick one or more.'}
        </span>
        <button className="vb-link" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary vb-small"
          type="button"
          disabled={picked.length === 0}
          onClick={() =>
            onAdd(
              picked.map((src) => ({
                kind: 'photo',
                src,
                alt: LIBRARY.find((l) => l.src === src)?.alt ?? '',
              })),
            )
          }
        >
          Add
        </button>
      </div>
    </div>
  )
}
