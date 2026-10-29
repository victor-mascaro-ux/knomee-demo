# Candidate Analytics: where its numbers come from

`#/firm-analytics` (Analytics → *Candidate Analytics*) is the one analytics page
in the demo built on real data. It reads the advisor directory in Firestore
each time it opens and shows counts only: no name, firm or answer.
`src/data/candidateActivation.ts` does the counting; the page is
`src/screens/CandidateAnalyticsScreen.tsx`. The page it replaced, with its
placeholder pipeline, is behind **Older Version** at `#/firm-analytics/older`.

## The funnel, per invite link

| Step | Recorded by | Where it lives | Counting |
| --- | --- | --- | --- |
| Opened the Recruit Toolkit | the toolkit's `open` event (kit `recruit`) | Firestore `toolkit-events` | once the toolkit-events rule is in |
| Copied an invitation | the toolkit's `copy` event (Copy Text) | Firestore `toolkit-events` | once the toolkit-events rule is in |
| Opened a link from a template | the link's UTM tags, kept on the invite the first time it opens | `invites/<token>.openedVia` | since Oct 29, 2026 |
| Sent a link | Invite, on Candidates | `invites/<token>.createdAt` | live |
| Opened the link | the flow, on first open | `invites/<token>.openedAt` | live |
| Started answering | the flow, on the first thing answered (their name included) | `invites/<token>.answeredAt`, `sittings/<id>` | live |
| Finished the flow | every adventure taken to its end | `sittings/<id>` (answers, `answered` / `total`) | live |
| Signed | Mark as Signed on a live row of Candidates (the bolt, the row menu, or the profile), with the AUM in $M if known; Undo Signed removes it | `signed/<sitting id>` (`at`, `aum`) | since Oct 29, 2026 |

All of it sits under `video-feedback/knomee-demo-directory/` (see
`src/data/advisorDirectory.ts`). Each invite is one advisor, however many
phones answered it. Sittings started from the demo itself, not from a link, are
the team showing the flow and are left out. Links the team made to try the flow
are counted.

**What Knomee brought** (the ROI card) reads the signed advisors against the
Recruit Toolkit's Baseline: ACME's 15% first conversation to signed, 150 days,
and $250M per signed advisor (`recruitBaseline` in `candidateActivation.ts`,
from activation-playbook `firms/acme.json`). Finishing the flow stands in for
the first conversation, and only advisors who finished it since Oct 29, 2026
count toward the signed rate. Days run from the link sent to Mark as Signed. An
advisor signed without AUM counts at the baseline's $250M. A signed advisor's
trail shows initials only.

**Where they stop**: for each advisor who started and didn't finish, the
furthest sitting's first adventure still open, or *A little about you* when
they gave their name and answered no question.

## UTM tags on an invite link

The activation toolkit copies a recruiter's link with
`utm_source=knomee-toolkit&utm_medium=…&utm_campaign=<firm>&utm_content=<template>`
added to the end, after the route: `…/knomee-demo/#/flow/<token>?utm_source=…`.
The router reads the route from before the `?`, and `advisorDirectory.ts` keeps
the tags (from the hash or the query, its own or the review overlay's) on the
invite when its link is first opened.

The answers spreadsheet (`answers-sheet.md`) isn't part of this: it keeps each
sitting's answers, not the funnel.
