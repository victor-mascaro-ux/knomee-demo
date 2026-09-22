/* Adding a family member — and, the first time, creating the family.
 *
 * A household on knomee is not a thing an advisor sets up and then fills: it
 * exists because there is a second person in it. So there is one flow, and
 * whether it is "create a family" or "add a member" is decided by whether the
 * client is already in one — the first step only appears when there is no
 * family to add to yet.
 *
 * The modal is the app's own (.modal-backdrop / .modal / .modal-footer), so it
 * opens, closes and sits on the page exactly as the invite and convert modals
 * do.
 */

import { useEffect, useState } from 'react'
import './familyModal.css'
import { CloseIcon } from '../components/icons'

export interface NewMember {
  name: string
  email: string
  role: string
  /** Whether the invitation goes out with them. */
  invite: boolean
}

/* What a second seat usually is. "Other" is last because the list is ordered by
   how often it is the answer, not alphabetically. */
const ROLES = ['Spouse', 'Partner', 'Child', 'Parent', 'Sibling', 'Other']

export default function FamilyModal({
  /** The client the household is being built around. */
  clientName,
  /** Null when there is no family yet: the flow then names it first. */
  familyName,
  /** What the fields open on — the second seat this household is missing. */
  prefill,
  onClose,
  onSubmit,
}: {
  clientName: string
  familyName: string | null
  prefill?: Partial<NewMember>
  onClose: () => void
  onSubmit: (family: string, member: NewMember) => void
}) {
  const creating = familyName === null
  /* The surname is the family's name nine times out of ten, and a name the
     advisor does not have to think about is one fewer reason to abandon this. */
  const suggested = `${clientName.trim().split(' ').slice(-1)[0]} Family`
  const [family, setFamily] = useState(familyName ?? suggested)
  const [name, setName] = useState(prefill?.name ?? '')
  const [email, setEmail] = useState(prefill?.email ?? '')
  const [role, setRole] = useState(prefill?.role ?? ROLES[0])
  const [invite, setInvite] = useState(prefill?.invite ?? true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const ready = family.trim() !== '' && name.trim() !== ''
  const submit = () => {
    if (!ready) return
    onSubmit(family.trim(), { name: name.trim(), email: email.trim(), role, invite })
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal fam-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{creating ? 'Create a family' : 'Add a family member'}</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body fam-body">
          <p className="fam-lede">
            {creating ? (
              <>
                A household is two people or more. Naming it puts <b>{clientName}</b> and whoever
                you add here on one Family ID.
              </>
            ) : (
              <>
                They join <b>{family}</b>, and their answers land beside the ones already there.
              </>
            )}
          </p>

          {creating && (
            <label className="fam-field">
              <span className="invite-field-label">Family name</span>
              <input
                className="fam-input"
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                placeholder={suggested}
              />
            </label>
          )}

          <div className="fam-row">
            <label className="fam-field">
              <span className="invite-field-label">Full name</span>
              <input
                className="fam-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Who are you adding?"
                autoFocus
              />
            </label>
            <label className="fam-field fam-field-narrow">
              <span className="invite-field-label">Relationship</span>
              <select className="fam-input" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="fam-field">
            <span className="invite-field-label">Email</span>
            <input
              className="fam-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Where the invitation goes"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </label>

          {/* The invitation is the point of adding someone: they answer the
              adventures themselves, and nothing appears on the Family ID until
              they do. Off, they are on the list and nothing else. */}
          <label className="fam-check">
            <input type="checkbox" checked={invite} onChange={(e) => setInvite(e.target.checked)} />
            <span>
              Send the invitation now
              <i>They take the adventures themselves; their answers fill the Family ID.</i>
            </span>
          </label>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" type="button" disabled={!ready} onClick={submit}>
            {creating ? 'Create family' : 'Add member'}
          </button>
        </div>
      </div>
    </div>
  )
}
