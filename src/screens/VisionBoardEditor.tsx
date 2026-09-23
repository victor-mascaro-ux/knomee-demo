/* A vision board changed where it hangs. Edit no longer opens a panel over
 * the page: the board itself takes its editing controls — a cross on every
 * tile, a handle to size the photographs, tiles carried to a new place — and
 * its three ways to add (Write, Photo, Speak) hold to the foot of the screen
 * while it is being worked on, clear of the phone's tab bar. Cancel and Save
 * sit where Edit was.
 *
 * Making a new board still starts in the panel, because a board needs a name
 * before it has anything on it.
 */

import { useRef, useState } from 'react'
import './addVisionBoardModal.css'
import type { BoardTile, VisionBoard } from '../data/clientProfile'
import { Board, type TileSize } from './ClientProfileScreen'
import {
  MicIcon,
  PhotoIcon,
  PhotoPicker,
  TextComposer,
  TextIcon,
  VoiceComposer,
} from './AddVisionBoardModal'
import { CloseIcon } from '../components/icons'

type Mode = null | 'text' | 'voice' | 'photo'

export default function VisionBoardEditor({
  board,
  onSave,
  onCancel,
  onDelete,
}: {
  board: VisionBoard
  onSave: (board: VisionBoard) => void
  onCancel: () => void
  onDelete: () => void
}) {
  const [tiles, setTiles] = useState<BoardTile[]>(board.tiles)
  const [mode, setMode] = useState<Mode>(null)
  const [deleting, setDeleting] = useState(false)
  const photoInput = useRef<HTMLInputElement>(null)

  const add = (t: BoardTile) => {
    setTiles((ts) => [...ts, t])
    setMode(null)
  }
  const resize = (i: number, size: TileSize) =>
    setTiles((ts) =>
      ts.map((t, j) =>
        j === i && t.kind === 'photo'
          ? { ...t, wide: size === '2x1' || undefined, tall: size === '1x2' || undefined, sized: true }
          : t,
      ),
    )
  const addPhotos = (files: FileList | null) => {
    if (!files) return
    const photos = Array.from(files).filter((f) => f.type.startsWith('image/'))
    setTiles((ts) => [
      ...ts,
      ...photos.map(
        (f): BoardTile => ({ kind: 'photo', src: URL.createObjectURL(f), alt: f.name.replace(/\.[^.]+$/, '') }),
      ),
    ])
    setMode(null)
  }

  return (
    <>
      <Board
        board={{ ...board, tiles }}
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
        head={
          <>
            <button className="vb-link" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="btn btn-primary vb-small"
              type="button"
              disabled={tiles.length === 0}
              onClick={() => onSave({ ...board, tiles })}
            >
              Save
            </button>
          </>
        }
        foot={
          <>
            <button className="vb-link vb-delete vb-inline-delete" type="button" onClick={() => setDeleting(true)}>
              Delete board
            </button>
            {/* Held to the foot of the screen while the board is on it. */}
            <div className="vb-inline-dock">
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
                  <button type="button" className="vb-add" onClick={() => setMode('photo')}>
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
          </>
        }
      />
      {deleting && (
        <div className="modal-backdrop" onClick={() => setDeleting(false)} role="alertdialog" aria-modal="true">
          <div className="modal vb-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete this board?</h2>
              <button className="modal-close" type="button" aria-label="Close" onClick={() => setDeleting(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <p className="vb-leave-note">
                “{board.title}” and everything on it will be removed. This can’t be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline vb-delete-yes" type="button" onClick={onDelete}>
                Delete board
              </button>
              <button className="btn btn-primary" type="button" autoFocus onClick={() => setDeleting(false)}>
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
