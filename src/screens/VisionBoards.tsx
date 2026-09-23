/* Vision boards that can be made and changed, wherever a Financial ID shows
 * them: her phone, the advisor's client and prospect pages, and each member's
 * column on the Family ID. One piece so the four do not drift — the same card,
 * the same way in, the same panel.
 *
 * The boards live in the page's state, seeded from whatever the persona was
 * authored with, so a demo can add to or change a board and a reload puts the
 * authored one back.
 */

import { useRef, useState } from 'react'
import type { VisionBoard } from '../data/clientProfile'
import AddVisionBoardModal from './AddVisionBoardModal'
import VisionBoardEditor from './VisionBoardEditor'
import { Board } from './ClientProfileScreen'
import { AddButton, EMPTY_ART, EmptyFold, EmptyState, sortFresh, withTag } from './profileParts'
import icVision from '../assets/adventures/vision-board.svg'

/* The boards, the panel, and the ways into it. `body` is the boards (or the
   empty tray that starts one); `modal` is the panel while it is open. */
export function useVisionBoards(initial: VisionBoard[], onToast?: (msg: string) => void) {
  const [boards, setBoards] = useState<VisionBoard[]>(initial)
  /* null: shut. 'new': a board being made. A number: that board, being
     changed. */
  const [open, setOpen] = useState<'new' | number | null>(null)
  const add = () => setOpen('new')
  /* The board being changed in place, if any. */
  const [editingAt, setEditingAt] = useState<number | null>(null)
  /* The width the board is drawn at on the page, handed to the panel so the
     board being edited is laid out at exactly that width — the same columns,
     the same notes wrapping the same way — and only then shrunk to fit. */
  const bodyRef = useRef<HTMLDivElement>(null)

  const body = (
    <div ref={bodyRef}>
      {boards.length === 0 ? (
        <EmptyState art={EMPTY_ART.visionBoard} label="Make a Vision Board" cta onClick={add} />
      ) : (
        <div className="cp-boards">
          {boards.map((b, i) =>
            /* Edit changes the board where it hangs, not in a panel. */
            editingAt === i ? (
              <VisionBoardEditor
                key={`${i}:${b.title}:edit`}
                board={b}
                onCancel={() => setEditingAt(null)}
                onSave={(nb) => {
                  setBoards((bs) => sortFresh(bs.map((o, j) => (j === i ? withTag(nb, 'Updated') : o))))
                  onToast?.('Vision board updated')
                  setEditingAt(null)
                }}
                onDelete={() => {
                  setBoards((bs) => bs.filter((_, j) => j !== i))
                  onToast?.('Vision board deleted')
                  setEditingAt(null)
                }}
              />
            ) : (
              <Board board={b} key={`${i}:${b.title}`} onEdit={() => setEditingAt(i)} />
            ),
          )}
        </div>
      )}
    </div>
  )

  const editing = typeof open === 'number' ? boards[open] : undefined
  const modal =
    open === null ? null : (
      <AddVisionBoardModal
        board={editing}
        boardWidth={bodyRef.current?.clientWidth}
        onClose={() => setOpen(null)}
        onSave={(b) => {
          setBoards((bs) =>
            sortFresh(
              typeof open === 'number'
                ? bs.map((o, i) => (i === open ? withTag(b, 'Updated') : o))
                : [withTag(b, 'New'), ...bs],
            ),
          )
          onToast?.(typeof open === 'number' ? 'Vision board updated' : 'Vision board saved')
          setOpen(null)
        }}
        onDelete={
          typeof open === 'number'
            ? () => {
                setBoards((bs) => bs.filter((_, i) => i !== open))
                onToast?.('Vision board deleted')
                setOpen(null)
              }
            : undefined
        }
      />
    )

  return { boards, add, body, modal }
}

/* The card as the single-person pages draw it: the title with its plus. */
export function VisionBoardCard({
  initial,
  onToast,
}: {
  initial: VisionBoard[]
  onToast?: (msg: string) => void
}) {
  const v = useVisionBoards(initial, onToast)
  return (
    <section className="pp-card">
      <EmptyFold
        empty={v.boards.length === 0}
        title={<span className="pp-card-title">
          <img className="pp-card-ic is-inset" src={icVision} alt="" />
          Future Vision Board
        </span>}
        action={<AddButton label="Add a vision board" onClick={v.add} />}
      >
      {v.body}
      </EmptyFold>
      {v.modal}
    </section>
  )
}

/* One member's boards inside the Family ID's shared card, which draws the
   title itself: the plus goes under their boards instead. */
export function MemberVisionBoards({ initial }: { initial: VisionBoard[] }) {
  const v = useVisionBoards(initial)
  return (
    <>
      {v.body}
      {v.boards.length > 0 && (
        <button type="button" className="cp-board-more" onClick={v.add}>
          + Add a vision board
        </button>
      )}
      {v.modal}
    </>
  )
}
