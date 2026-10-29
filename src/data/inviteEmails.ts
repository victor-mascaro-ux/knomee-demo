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

/* A prospect gets two emails from the product, each one fixed, nothing to
   pick: Invite Prospect sends the Hot lead's Confirmation, and a row's Resend
   Invite Link sends the Cold lead's "No Strings" nudge. The toolkit's other
   prospect emails are sent from the toolkit, not from here. */
export const PROSPECT_INVITE_EMAIL = 'hot-1'
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
        'Hi {{First Name}},\n\nMost financial conversations start with your money. Here’s a different place to start: you.\n\nI’m offering a free 8-minute guided experience that helps you clarify what you want your money to make possible, what matters most right now, and the financial questions you want answered.\n\nYou’ll walk away with:\n- A clearer understanding of what’s most important to you\n- Personalized insights about your financial priorities\n- Better questions to ask any financial advisor\n\nNo appointment required.',
      cta: 'Start Your Personalized Assessment →',
      signoff: SIGNED,
    },
    {
      id: 'hot-1',
      stage: 'Hot',
      name: 'Confirmation',
      subject: 'Before we meet',
      message:
        'Hi {{First Name}},\n\nI’m looking forward to meeting you.\n\nBefore we do, take about 8 minutes for this guided experience. It will help you organize your thoughts, uncover your top three money questions, and see what’s driving your financial decisions, with personalized insights that are yours to keep.\n\nYou’ll come to our meeting with more clarity, and rather than spending it on basic fact-finding, we’ll focus on the questions, goals, and opportunities that matter most to you.',
      cta: 'Get My Personalized Insights →',
      signoff: 'I’m looking forward to our conversation.\n\n' + SIGNED,
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
        'Hi {{First Name}},\n\nAhead of our meeting, I want to make sure our conversation is focused on what matters most to you right now.\n\nKnomee is a brief experience that helps you reflect on your goals, priorities, and what’s top of mind. Take a few minutes with it before we meet — you’ll get a personal summary to keep, and you’ll come to our conversation clearer on what you want from it:',
      cta: 'Access Your Knomee Experience Here →',
      signoff: SIGNED,
    },
    {
      id: 'eng-2',
      stage: 'Engaged',
      name: 'Mid-Year Pulse',
      note: 'Between reviews',
      subject: 'A quick mid-year check-in',
      message:
        'Hi {{First Name}},\n\nA lot can change between reviews. I wanted to reach out with a quick mid-year check-in.\n\nIf anything has shifted, Knomee is a simple way to take stock of what’s changed for you, so our next meeting starts with what matters now.',
      cta: 'See What’s Changed →',
      signoff: SIGNED,
    },
    {
      id: 'eng-3',
      stage: 'Engaged',
      name: 'Meeting Recap',
      note: '1–2 days after',
      subject: 'Great connecting today',
      message:
        'Hi {{First Name}},\n\nThank you for meeting today. As a recap, the main areas we discussed: {{Priority 1}}, {{Priority 2}}, {{Priority 3}}. Next steps: {{Next Step 1}}, {{Next Step 2}}.\n\nI’ll keep your Knomee responses in mind as we continue working together.',
      cta: 'View Your Knomee Summary →',
      signoff: SIGNED,
    },
    {
      id: 'dis-1',
      stage: 'Disengaged',
      name: 'Annual Check-In',
      note: 'The default re-opener',
      subject: 'A quick check-in to make sure we’re focused on what matters',
      message:
        'Hi {{First Name}},\n\nIt’s been a while since we connected, and I wanted to reach out with a quick check-in.\n\nRather than assume your priorities are the same, I’d like to give you a simple way to see what’s top of mind for you now. Knomee is a brief experience that helps you reflect on what may have changed, and you’ll get a personal summary to keep.',
      cta: 'Access Your Knomee Experience Here →',
      signoff: SIGNED,
    },
    {
      id: 'dis-2',
      stage: 'Disengaged',
      name: 'Life-Event Check-In',
      note: 'When something changed',
      subject: 'A quick check-in on changes in your financial picture',
      message:
        'Hi {{First Name}},\n\nI wanted to check in on whether anything has changed in your financial picture or planning needs since we last spoke.\n\nIf new responsibilities or questions have come up, Knomee is a helpful starting point. It helps you sort out what’s changed and what you most want answered, and you’ll get a personal summary to keep.',
      cta: 'Access Your Knomee Experience Here →',
      signoff: SIGNED,
    },
  ],
}

const ALL = [...INVITE_EMAILS.prospect, ...INVITE_EMAILS.client]

/** The lead or client types, in the toolkit's order. */
export function stagesOf(audience: InviteAudience): string[] {
  return [...new Set(INVITE_EMAILS[audience].map((e) => e.stage))]
}

/** "Curiosity · Option 1" — but an Option 1 with no other option beside it
    in its stage is not a choice between two, so it is just its name. */
export function emailLabel(e: InviteEmail): string {
  const paired = !!e.option && ALL.some((o) => o !== e && o.stage === e.stage && o.option)
  return paired ? `${e.name} · Option ${e.option}` : e.name
}

/* Only firms with their own toolkit edition (activation-playbook's firms/)
   get a link to it; any other brand, and knomee itself, opens the knomee one.
   The name is the one that edition fills {{Firm Name}} with. */
const TOOLKIT_FIRMS: Record<string, string> = { acme: 'Acme Advisors' }

export function toolkitFirmName(brandId: string | null): string | undefined {
  return brandId ? TOOLKIT_FIRMS[brandId] : undefined
}

/** The toolkit page the samples come from, open on the sample's own section. */
export function toolkitUrl(audience: InviteAudience, stage: string, brandId: string | null): string {
  const firm = brandId && TOOLKIT_FIRMS[brandId] ? brandId : 'none'
  return `https://activation.knomee.com/${audience}-toolkit.html?firm=${firm}#${stage.toLowerCase()}`
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
