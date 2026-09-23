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
  /** The two halves, and the name they make — which is what the household,
      the table and every page downstream actually read. */
  first: string
  last: string
  name: string
  email: string
  phone?: string
  role: string
  /** Optional, and only ever used to tell two people with one name apart. */
  dob?: string
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
  /* Asked as two fields because that is how a name is typed off a form or a
     phone call — and because the surname is the one that says which household
     they are joining. */
  const [first, setFirst] = useState(prefill?.first ?? prefill?.name?.split(' ')[0] ?? '')
  const [last, setLast] = useState(
    prefill?.last ?? prefill?.name?.split(' ').slice(1).join(' ') ?? '',
  )
  const [email, setEmail] = useState(prefill?.email ?? '')
  const [phone, setPhone] = useState(prefill?.phone ?? '')
  const [dob, setDob] = useState(prefill?.dob ?? '')
  const [role, setRole] = useState(prefill?.role ?? ROLES[0])
  const [invite, setInvite] = useState(prefill?.invite ?? true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const name = [first.trim(), last.trim()].filter(Boolean).join(' ')
  /* An invitation with nowhere to go is not an invitation: the address is
     required only when one is being sent. */
  const ready = family.trim() !== '' && name !== '' && (!invite || email.trim() !== '')
  const submit = () => {
    if (!ready) return
    onSubmit(family.trim(), {
      first: first.trim(),
      last: last.trim(),
      name,
      email: email.trim(),
      phone: phone.trim() || undefined,
      dob: dob.trim() || undefined,
      role,
      invite,
    })
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
              <span className="invite-field-label">First name</span>
              <input
                className="fam-input"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                placeholder="First name"
                autoFocus
              />
            </label>
            <label className="fam-field">
              <span className="invite-field-label">Last name</span>
              <input
                className="fam-input"
                value={last}
                onChange={(e) => setLast(e.target.value)}
                placeholder="Last name"
              />
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

          <div className="fam-row">
            <label className="fam-field">
              <span className="invite-field-label">Phone (optional)</span>
              <input
                className="fam-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
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

          <label className="fam-field fam-field-narrow">
            <span className="invite-field-label">Date of birth (optional)</span>
            <input
              className="fam-input"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              placeholder="MM/DD/YYYY"
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
            {creating ? 'Create family' : invite ? 'Send Invite' : 'Add member'}
          </button>
        </div>
      </div>
    </div>
  )
}
