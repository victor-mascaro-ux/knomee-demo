/* The product's own pieces, handed to the adoption demo by App.
 *
 * They live in App.tsx and aren't exported from it; App passes them in rather
 * than the demo importing App, which would make the two modules import each
 * other. The shapes below are the props the demo uses. App's components are
 * checked against them where it passes them, so a change to one shows up as a
 * type error there.
 */

import type { ComponentType, ReactNode } from 'react'
import type { ClientBrand } from '../components/clientBrands'
import type { InviteEmail } from '../data/inviteEmails'
import type { Prospect, prospectStats } from '../data/prospects'

export type BookStats = typeof prospectStats

export type InviteDraft = Pick<InviteEmail, 'subject' | 'message' | 'cta' | 'signoff'>

/** The compose window (App's InviteCompose): the email as it will arrive,
    edited where it stands, with Send at its foot. */
export interface ComposeProps {
  sample: InviteEmail
  draft: InviteDraft
  edited: boolean
  onDraft: (d: InviteDraft) => void
  onReset: () => void
  missing: string[]
  brand: ClientBrand | null
  link: string
  kind: 'prospect' | 'client'
  label: string
  to: string
  onTo: (v: string) => void
  toBad: boolean
  onSend: () => unknown
  sending: boolean
  known: Record<string, string>
  fields: Record<string, string>
  onField: (k: string, v: string) => void
  flagged: boolean
}

/** The product's Invite window (App's InviteModal): Prospect or Client, a
    link or a QR code, each with its Copy. */
export interface InviteModalProps {
  initialKind: 'prospect' | 'client'
  onClose: () => void
  onShared?: (how: 'link' | 'qr') => void
  /** The Email tab's contents for a kind, or null for none. */
  emailPanel?: (kind: 'prospect' | 'client') => ReactNode
}

export interface ProspectsScreenProps {
  onConvert: (p: Prospect) => void
  onResend: (p: Prospect) => void
  onDownload: () => void
  onInvite: () => void
  onOpenProfile: (p: Prospect) => void
  rows?: Prospect[]
  stats?: BookStats
  rowClassName?: (p: Prospect) => string | undefined
  renderAction?: (p: Prospect) => ReactNode
  afterMetrics?: ReactNode
}

export interface DemoKit {
  /** The dashboard's tab bar, as App draws it. */
  tabs: ReactNode
  EmptyScreen: ComponentType<{ variant: 'prospects'; onCta?: () => void; onInvite?: () => void }>
  ProspectsScreen: ComponentType<ProspectsScreenProps>
  InviteCompose: ComponentType<ComposeProps>
  InviteModal: ComponentType<InviteModalProps>
  PoweredBy: ComponentType
}
