/* The emails the Invite modal sends: the samples from the Activation Toolkits
 * (activation.knomee.com — the activation-playbook repo), so an advisor picks
 * the same email in the product that their firm's toolkit hands them.
 *
 * Copied from the sample store of prospect-toolkit.html and client-toolkit.html,
 * ids and all, emails only: the ads, postcards and social posts there are not
 * something this modal sends. The toolkit sets a few lines in bold; here the
 * text is plain, because the advisor edits it as plain text, in place. A change
 * to a sample there has to be made here too.
 *
 * {{Placeholders}} are the toolkit's own. Advisor Name and Firm Name are filled
 * in from the demo; the rest (First Name, Day…) the advisor types into the
 * email itself, as they do in the toolkit. */

export type InviteAudience = 'prospect' | 'client'

export interface InviteEmail {
  /** The toolkit's sample id. */
  id: string
  /** The lead or client type it is written for — the toolkit's section. */
  stage: string
  /** What kind of email it is, from the toolkit's label for it
      ("Email · Nurture · Option 1"): the name, the option, and the note on
      when to send it. */
  name: string
  option?: number
  note?: string
  subject: string
  /** Above the button. Paragraphs are split by a blank line. */
  message: string
  /** The button's words. It links to this invite's own link. */
  cta: string
  /** Below the button. */
  signoff: string
}

const SIGNED = 'Best,\n{{Advisor Name}}\n{{Firm Name}}'

/* The product sends one of these: a prospect row's Resend Invite Link sends
   the Cold lead's "No Strings" nudge. The Invite modal hands over a link or a
   QR code rather than an email, so the others are the toolkit's copy, sent
   from the toolkit, not from here. */
export const PROSPECT_RESEND_EMAIL = 'cold-2'

export const INVITE_EMAILS: Record<InviteAudience, InviteEmail[]> = {
  prospect: [
    {
      id: 'cold-2',
      stage: 'Cold',
      name: 'No Strings',
      option: 2,
      subject: 'Most financial conversations start in the wrong place',
      message:
        'Hi {{First Name}},\n\nMost financial conversations start with your money. Here’s a different place to start: you.\n\nThis free 8-minute check-in helps you get clear on what you want your money to make possible and the questions you want answered.\n\nYou’ll walk away with:\n- A clearer picture of what matters most to you\n- A personal summary to keep\n- Better questions to ask any financial advisor\n\nNo appointment required.',
      cta: 'Start Your Check-In →',
      signoff: SIGNED,
    },
    {
      id: 'hot-1',
      stage: 'Hot',
      name: 'Confirmation',
      subject: 'Before we meet',
      message:
        'Hi {{First Name}},\n\nI’m looking forward to meeting you.\n\nBefore we do, take about 8 minutes for this short check-in. It helps you organize your thoughts and uncover your top three money questions, and you’ll get a personal summary to keep.\n\nWe’ll skip the basic fact-finding and spend our time on the questions and goals that matter most to you.',
      cta: 'Start Your Check-In →',
      signoff: SIGNED,
    },
  ],
  client: [
    {
      id: 'eng-1',
      stage: 'Engaged',
      name: 'Pre-Meeting Invite',
      note: '2 weeks before',
      subject: 'A quick check-in before we connect',
      message:
        'Hi {{First Name}},\n\nBefore we meet, I’d like to know what’s top of mind for you, so we spend our time on what matters most.\n\nThis short check-in takes a few minutes. You’ll come in clearer on what you want from our meeting, and you’ll get a personal summary to keep.',
      cta: 'Start Your Check-In →',
      signoff: SIGNED,
    },
    {
      id: 'eng-2',
      stage: 'Engaged',
      name: 'Mid-Year Pulse',
      note: 'Between reviews',
      subject: 'A quick mid-year check-in',
      message:
        'Hi {{First Name}},\n\nA lot can change between reviews. If anything has shifted for you, this quick check-in helps you take stock, and our next meeting starts right there.',
      cta: 'See What’s Changed →',
      signoff: SIGNED,
    },
    {
      id: 'dis-1',
      stage: 'Disengaged',
      name: 'Annual Check-In',
      note: 'The default re-opener',
      subject: 'A quick check-in to make sure we’re focused on what matters',
      message:
        'Hi {{First Name}},\n\nIt’s been a while since we connected, and I don’t want to assume your priorities are the same.\n\nThis short check-in takes a few minutes and helps you see what’s top of mind for you now. You’ll get a personal summary to keep.',
      cta: 'Start Your Check-In →',
      signoff: SIGNED,
    },
    {
      id: 'dis-2',
      stage: 'Disengaged',
      name: 'Life-Event Check-In',
      note: 'When something changed',
      subject: 'A quick check-in on changes in your financial picture',
      message:
        'Hi {{First Name}},\n\nHas anything changed in your life or finances since we last spoke?\n\nIf new questions have come up, this short check-in helps you sort out what’s changed and what you most want answered. You’ll get a personal summary to keep.',
      cta: 'Start Your Check-In →',
      signoff: SIGNED,
    },
  ],
}

/* Only firms with their own toolkit edition (activation-playbook's firms/):
   the name that edition fills {{Firm Name}} with. Any other brand, and knomee
   itself, has none. */
const TOOLKIT_FIRMS: Record<string, string> = { acme: 'Acme Advisors' }

export function toolkitFirmName(brandId: string | null): string | undefined {
  return brandId ? TOOLKIT_FIRMS[brandId] : undefined
}

/** The placeholders a piece of text still asks for, in order, once. */
export function placeholdersIn(text: string): string[] {
  const out: string[] = []
  for (const m of text.matchAll(/\{\{([^}]+)\}\}/g)) {
    const k = m[1].trim()
    if (!out.includes(k)) out.push(k)
  }
  return out
}
