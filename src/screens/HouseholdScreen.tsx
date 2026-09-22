/* The family page — a household read as one thing rather than as two clients
 * who happen to share a surname.
 *
 * It is the client page's own shell: the same breadcrumb, the same rail (the
 * household and the advisory team, which belong to the family and not to
 * either person), the same tabs and cards, in the same client palette. What
 * changes is the subject — the name at the top is the family's, and the first
 * tab manages who is in it.
 *
 * Every member row reads off the Clients table, so a status here cannot
 * disagree with the row the same person has there.
 */

import { useState } from 'react'
import './prospectProfile.css'
import './clientProfile.css'
import './household.css'
import { clientProfile } from '../data/clientProfile'
import { baseClients } from '../data/clients'
import type { Client } from '../data/clients'
import { Portrait } from './ClientProfileScreen'
import RowMenu from '../components/RowMenu'
import { RowChevron } from '../components/profileIcons'
import { scrollPageToTop } from '../reviewBridge'

type FamilyTab = 'members' | 'id' | 'insights'

/* A member's row on the Clients table, where their status actually lives. */
const rowFor = (name: string): Client | undefined => baseClients.find((c) => c.name === name)

export default function HouseholdScreen({
  onBack,
  onOpenMember,
  onAction,
}: {
  onBack: () => void
  /* Opens that person's own page. Everyone in this household has a row in the
     Clients table, so everyone's name is a link. */
  onOpenMember: (c: Client) => void
  /* The prototype's stand-in for the things this page would really do. */
  onAction: (msg: string) => void
}) {
  const [tab, setTab] = useState<FamilyTab>('members')
  const cp = clientProfile

  return (
    <div className="pp cp hh">
      <nav className="pp-crumb">
        <button type="button" className="pp-crumb-link" onClick={onBack}>
          My Clients
        </button>
        <span className="pp-crumb-sep">›</span>
        <span className="pp-crumb-cur">{cp.household}</span>
      </nav>

      <div className="pp-layout">
        <aside className="pp-side">
          <div className="pp-side-inner">
            {/* The family's monogram, in the disc a person's portrait would
                take — a household has no face of its own. */}
            <span className="pp-avatar hh-monogram">{cp.household.charAt(0)}</span>
            <h2 className="pp-name">{cp.household}</h2>

            <div className="cp-side-block">
              <span className="cp-side-head is-static">
                {cp.household}
                <span className="cp-side-count">{cp.members.length}</span>
              </span>
              {cp.members.map((m) => {
                const row = rowFor(m.name)
                return (
                  <button
                    className="cp-person"
                    type="button"
                    key={m.name}
                    onClick={() => row && onOpenMember(row)}
                  >
                    <Portrait name={m.name} size="sm" />
                    <span className="cp-person-main">
                      <b>{m.name}</b>
                      <i>{m.role}</i>
                    </span>
                    <RowChevron />
                  </button>
                )
              })}
            </div>

            <div className="cp-side-block">
              <span className="cp-side-head is-static">Advisory Team</span>
              {cp.team.map((m) => (
                <div className="cp-person is-static" key={m.name}>
                  <Portrait name={m.name} size="sm" />
                  <span className="cp-person-main">
                    <b>{m.name}</b>
                    <i>{m.role}</i>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="pp-main">
          <div className="pp-tabs">
            {(
              [
                ['members', 'Manage Members'],
                ['id', 'Family ID'],
                ['insights', 'Family Insights'],
              ] as [FamilyTab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`pp-tab ${tab === id ? 'is-active' : ''}`}
                onClick={() => {
                  setTab(id)
                  scrollPageToTop()
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'members' ? (
            <>
              <div className="pp-title-row">
                <h1 className="pp-title">Manage Household Members</h1>
                {/* The two controls are one cluster at the title's right, not
                    two things the row spaces out between themselves. */}
                <div className="hh-actions">
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => onAction('Edit family')}
                  >
                    Edit Family
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => onAction('Invite sent')}
                  >
                    Add Family Member
                  </button>
                </div>
              </div>

              <section className="pp-card hh-card">
                <div className="pp-card-head">
                  <span className="pp-card-title">Members</span>
                </div>
                <div className="hh-members">
                  {cp.members.map((m) => {
                    const row = rowFor(m.name)
                    /* Both readings come off that row: whether the person is
                       live on knomee, and whether their Financial ID is
                       finished. A household with an invitation outstanding
                       shows it here rather than on nobody's page. */
                    const pending = row?.status === 'pending'
                    const profile = row?.status === 'complete' ? 'complete' : 'incomplete'
                    return (
                      <div className="hh-member" key={m.name}>
                        <span className="hh-member-face">
                          <Portrait name={m.name} size="sm" />
                        </span>
                        <div className="hh-member-main">
                          <button
                            type="button"
                            className="hh-member-name"
                            onClick={() => row && onOpenMember(row)}
                          >
                            {m.name}
                            <span className="name-chevron" aria-hidden>
                              ›
                            </span>
                          </button>
                          <span className="hh-member-meta">
                            {m.role} • Joined {m.joined}
                          </span>
                        </div>
                        <span className={`hh-pill ${pending ? 'is-pending' : 'is-active'}`}>
                          {pending ? 'invited' : 'active'}
                        </span>
                        <span className={`hh-pill is-quiet ${profile === 'complete' ? 'is-done' : ''}`}>
                          {profile}
                        </span>
                        <RowMenu
                          items={[
                            {
                              label: 'Open profile',
                              onClick: () => row && onOpenMember(row),
                            },
                            { label: 'Change role', onClick: () => onAction('Role updated') },
                            {
                              label: 'Resend invitation',
                              onClick: () => onAction('Invitation resent'),
                              disabled: !pending,
                            },
                            {
                              label: 'Remove from household',
                              onClick: () => onAction('Removed from household'),
                            },
                          ]}
                        />
                      </div>
                    )
                  })}
                </div>
              </section>
            </>
          ) : (
            <>
              <div className="pp-title-row">
                <h1 className="pp-title">
                  {cp.household}’s {tab === 'id' ? 'Family ID' : 'Insights'}
                </h1>
              </div>
              <div className="pp-placeholder">
                {tab === 'id'
                  ? 'Family ID — the household’s shared picture: the goals, life events and vision the members hold in common, and where they differ. Not built in this prototype.'
                  : 'Family Insights — the household’s relationship score, who is engaged and who has gone quiet, and the conversation to have with them together. Not built in this prototype.'}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
