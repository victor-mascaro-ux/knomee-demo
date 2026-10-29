/* The emails the Invite modal sends: the samples from the Activation Toolkits
 * (activation.knomee.com — the activation-playbook repo), so an advisor picks
 * the same email in the product that their firm's toolkit hands them.
 *
 * Copied from the sample store of prospect-toolkit.html and client-toolkit.html,
 * ids and all, emails only: the ads, postcards and social posts there are not
 * something this modal sends. The toolkit sets a few lines in bold; here the
 * text is plain, because the advisor edits it in a plain text field. A change
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
  /** The toolkit's own label for it. */
  type: string
  subject: string
  /** Above the button. Paragraphs are split by a blank line. */
  message: string
  /** The button's words. It links to this invite's own link. */
  cta: string
  /** Below the button. */
  signoff: string
}

const SIGNED = 'Best,\n{{Advisor Name}}\n{{Firm Name}}'

export const INVITE_EMAILS: Record<InviteAudience, InviteEmail[]> = {
  prospect: [
    {
      id: 'cold-1',
      stage: 'Cold',
      type: 'Email · Curiosity · Option 1',
      subject: 'How well does your financial advisor really know you?',
      message:
        'Hi {{First Name}},\n\nMost financial advisors know your portfolio.\n\nFar fewer understand what’s actually driving your decisions.\n\nWe’ve created a short, 8-minute experience that helps uncover what’s most important to you, what’s changing in your life, and the questions worth discussing with an advisor.\n\nAt the end, you’ll receive a personalized summary that’s yours to keep.\n\nNo sales pitch. No obligation. Just a clearer picture of what matters most to you — and whether your financial plan reflects it.',
      cta: 'Take the Assessment →',
      signoff: SIGNED,
    },
    {
      id: 'cold-2',
      stage: 'Cold',
      type: 'Email · No Strings · Option 2',
      subject: 'Most financial conversations start in the wrong place',
      message:
        'Hi {{First Name}},\n\nMost financial conversations start with your money. Here’s a different place to start: you.\n\nI’m offering a free 8-minute guided experience that helps you clarify what you want your money to make possible, what matters most right now, and the financial questions you want answered.\n\nYou’ll walk away with:\n- A clearer understanding of what’s most important to you\n- Personalized insights about your financial priorities\n- Better questions to ask any financial advisor\n\nNo appointment required.',
      cta: 'Start Your Personalized Assessment →',
      signoff: SIGNED,
    },
    {
      id: 'warm-1',
      stage: 'Warm',
      type: 'Email · Nurture · Option 1',
      subject: 'Before your next financial decision',
      message:
        'Hi {{First Name}},\n\nYou’ve probably spent time thinking about your investments.\n\nBut have you spent time thinking about what you actually want them to accomplish?\n\nWe’ve partnered with Knomee to offer a free, research-backed experience that helps you better understand what’s driving your financial decisions.\n\nIn about 8 minutes, you’ll receive:\n- Personalized insights about your financial priorities\n- Your top three money questions\n- A summary you can keep and use in future financial conversations\n\nWhether you’re planning your next move or simply looking for more clarity, it’s a worthwhile investment of eight minutes.',
      cta: 'Get My Personalized Summary →',
      signoff: SIGNED,
    },
    {
      id: 'warm-2',
      stage: 'Warm',
      type: 'Email · Newsletter Feature',
      subject: 'A new way to get clear on what matters',
      message:
        'We’re excited to partner with Knomee, a research-backed experience to help you explore what matters most, what you want next, and what you want your wealth to make possible.\n\nIn just 8 minutes, you’ll discover what’s shaping your financial priorities, uncover your top three money questions, and receive personalized insights you can keep.\n\nIt’s a different way to prepare for your next financial conversation, and perhaps a better one.',
      cta: 'Discover Your Personalized Profile →',
      signoff: '',
    },
    {
      id: 'hot-1',
      stage: 'Hot',
      type: 'Email · Confirmation',
      subject: 'Before we meet',
      message:
        'Hi {{First Name}},\n\nI’m looking forward to meeting you.\n\nBefore we do, take about 8 minutes for this guided experience. It will help you organize your thoughts, uncover your top three money questions, and see what’s driving your financial decisions, with personalized insights that are yours to keep.\n\nYou’ll come to our meeting with more clarity, and rather than spending it on basic fact-finding, we’ll focus on the questions, goals, and opportunities that matter most to you.',
      cta: 'Get My Personalized Insights →',
      signoff: 'I’m looking forward to our conversation.\n\n' + SIGNED,
    },
    {
      id: 'hot-2',
      stage: 'Hot',
      type: 'Email · Reminder · 2 days before',
      subject: 'A quick reminder before we meet',
      message:
        'Hi {{First Name}},\n\nI’m looking forward to our conversation on {{Day}}.\n\nIf you haven’t had a chance yet, there’s still time to take the short 8-minute experience I sent over.\n\nIt will help you clarify what’s most important to you and identify your top three money questions, so you can come to our conversation knowing what you want to get out of it.\n\nI’ll review your responses in advance so we can spend less time on background questions and more time discussing what’s most relevant to you.\n\nThe personalized insights are yours to keep, whatever you decide.',
      cta: 'Start Here →',
      signoff: 'Looking forward to speaking with you.\n\n' + SIGNED,
    },
    {
      id: 'hot-3',
      stage: 'Hot',
      type: 'Email · Meeting Follow-Up',
      subject: 'Thank you',
      message:
        'Hi {{First Name}},\n\nThank you again for meeting with me. I enjoyed our conversation.\n\nAs you reflect on what we discussed, the 8-minute Knomee experience is a useful way to take that thinking further. You’ll clarify what you want your wealth to make possible, uncover your 3 most important financial questions, and receive personalized insights to keep.',
      cta: 'Continue the Conversation →',
      signoff: 'I’m happy to answer any questions as you consider what comes next.\n\n' + SIGNED,
    },
  ],
  client: [
    {
      id: 'eng-1',
      stage: 'Engaged',
      type: 'Email · Pre-Meeting Invite · 2 weeks before',
      subject: 'A quick check-in before we connect',
      message:
        'Hi {{First Name}},\n\nAhead of our meeting, I want to make sure our conversation is focused on what matters most to you right now.\n\nKnomee is a brief experience that helps you reflect on your goals, priorities, and what’s top of mind. Take a few minutes with it before we meet — you’ll get a personal summary to keep, and you’ll come to our conversation clearer on what you want from it:',
      cta: 'Access Your Knomee Experience Here →',
      signoff: SIGNED,
    },
    {
      id: 'eng-2',
      stage: 'Engaged',
      type: 'Email · Mid-Year Pulse · between reviews',
      subject: 'A quick mid-year check-in',
      message:
        'Hi {{First Name}},\n\nA lot can change between reviews. I wanted to reach out with a quick mid-year check-in.\n\nIf anything has shifted, Knomee is a simple way to take stock of what’s changed for you, so our next meeting starts with what matters now.',
      cta: 'See What’s Changed →',
      signoff: SIGNED,
    },
    {
      id: 'eng-3',
      stage: 'Engaged',
      type: 'Email · Meeting Recap · 1–2 days after',
      subject: 'Great connecting today',
      message:
        'Hi {{First Name}},\n\nThank you for meeting today. As a recap, the main areas we discussed: {{Priority 1}}, {{Priority 2}}, {{Priority 3}}. Next steps: {{Next Step 1}}, {{Next Step 2}}.\n\nI’ll keep your Knomee responses in mind as we continue working together.',
      cta: 'View Your Knomee Summary →',
      signoff: SIGNED,
    },
    {
      id: 'dis-1',
      stage: 'Disengaged',
      type: 'Email · Annual Check-In · the default re-opener',
      subject: 'A quick check-in to make sure we’re focused on what matters',
      message:
        'Hi {{First Name}},\n\nIt’s been a while since we connected, and I wanted to reach out with a quick check-in.\n\nRather than assume your priorities are the same, I’d like to give you a simple way to see what’s top of mind for you now. Knomee is a brief experience that helps you reflect on what may have changed, and you’ll get a personal summary to keep.',
      cta: 'Access Your Knomee Experience Here →',
      signoff: SIGNED,
    },
    {
      id: 'dis-2',
      stage: 'Disengaged',
      type: 'Email · Life-Event Check-In · when something changed',
      subject: 'A quick check-in on changes in your financial picture',
      message:
        'Hi {{First Name}},\n\nI wanted to check in on whether anything has changed in your financial picture or planning needs since we last spoke.\n\nIf new responsibilities or questions have come up, Knomee is a helpful starting point. It helps you sort out what’s changed and what you most want answered, and you’ll get a personal summary to keep.',
      cta: 'Access Your Knomee Experience Here →',
      signoff: SIGNED,
    },
  ],
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
