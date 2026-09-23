/* Taking somebody out of a household.
 *
 * It is the one thing on this page that cannot be undone from this page, so it
 * asks — and it says what it does and does not do, because "remove" reads as
 * "delete" and this deletes nobody. They keep their row in the book of
 * business, their profile, their answers; what they lose is the household.
 */

import { useEffect } from 'react'
import { CloseIcon } from '../components/icons'

export default function RemoveMemberModal({
  name,
  familyName,
  onClose,
  onRemove,
}: {
  name: string
  familyName: string
  onClose: () => void
  onRemove: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal hh-remove" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Remove Family Member</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <p className="hh-remove-line">
            This will remove <b>{name}</b> from <b>{familyName}</b>.
          </p>
          <p className="hh-remove-line">
            They will still appear in your Advisor Dashboard; they just won’t be associated with
            this household.
          </p>
          <p className="hh-remove-line">Are you sure?</p>
        </div>

        <div className="modal-footer hh-remove-foot">
          <button className="btn btn-outline" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger" type="button" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
