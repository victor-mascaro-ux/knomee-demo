# My Prospects · "Who you're reaching" insight rules

The cards under **Who you're reaching** in Actionable Insights are generated
by rules, never typed. Every rule runs on the prospects in view: the whole
book, or the tier picked in the tier bar. Many rules can fire; **four cards
show**.

Code: `INSIGHT_RULES` and `pickInsights()` in `src/data/prospectGroup.ts`.
Change the code and this page together.

## What the rules read

Only what Knomee asks prospects:

| Source | Field | Scale |
|---|---|---|
| Financial Joy | up to 3 ranked picks → purpose family (Model B) | Protector, Experiencer, Liberator, Contributor, Achiever |
| Confidence | 6 sliders: condition, resilience, goal belief, joy spend, no-regret, advisor value | 0–100 |
| Confidence | posture (mean of condition, resilience, goals, no-regret) | Uneasy · Building · Confident |
| Future You | Clarity | 0–100 |
| Goals | Intent | 0–100 |

- **Low** = under 50. **High** = 70 and up.
- The tension rules (Gap, Permission) use the engine's own cuts from Model D:
  4+ of 5 = 75+, 3 or less = 50 or less.
- An unanswered slider never counts as a low one.

## When a rule fires

- It needs **at least 2 people**. One person is the table's business.
- It needs **at least its minimum share** of the group (below).
- Some rules also have a good-news version (marked ✓). It fires when nobody
  has the problem, or most clearly don't.

## The rules

| Rule | Topic | Fires when | Min | Weight | Card (example) | Action |
|---|---|---|---|---|---|---|
| purpose | purpose | always, if 2+ answered Joy | — | 1.0 | "Two camps: security and family vs. enjoying life now" | Book: "Write one invite per camp." Tier: "Have an opener for each camp." |
| giving | giving | picked *Philanthropy and giving* | 15% | 0.7 | "1 in 3 wants money to give back" | Book: "Mention giving in your invite." Tier: "Ask what they'd like to give to." |
| status | status | picked *Status* | 10% | 0.7 | "1 in 8 wants money for status" | "Show progress they can measure." |
| posture | posture | always, if 2+ answered | — | 0.9 | "87% aren't confident with money yet" · ✓ "Nobody is uneasy about money" | "Lead with stability, not growth." / "Educate before you pitch." / ✓ "Skip reassurance; talk next steps." |
| advisor | advisor | advisor value low | 20% | 1.0 | "1 in 3 doubts an advisor would help" · ✓ "Nobody doubts an advisor would help" (60%+ high) | "Share an insight before asking to meet." / half+: "Build trust before asking to meet." / ✓ "Ask for the meeting." |
| resilience | resilience | resilience low | 20% | 0.8 | "1 in 4 couldn't weather a setback" · ✓ "All could weather a setback" | "Offer a protection check." / half+: "Start with an emergency fund." / ✓ "Talk growth, not protection." |
| goals | goals | goal belief low | 20% | 0.8 | "1 in 5 doubts they'll reach their goals" | "Start with one goal they can hit soon." |
| gap | gap | goal belief 75+ and condition or resilience 50 or less (Model D *Confidence Gap*) | 15% | 0.85 | "1 in 5 believes in their goals but feels shaky today" | "Show the path from today to the goal." |
| permission | permission | condition and resilience 75+, joy spend 50 or less (Model D *Permission Gap*) | 15% | 0.8 | "1 in 5 could enjoy their money but hold back" | "Give them permission to spend on joy." |
| joy | joy | joy spend low | 25% | 0.7 | "1 in 4 rarely spends on what brings joy" | "Talk about joy, not just security." |
| regret | regret | no-regret low (Model D *Decision Fatigue*, read at halfway) | 20% | 0.75 | "4 of 5 second-guess their money moves" | "Hand them a simple plan to follow." |
| stuck | vision | Clarity 70+ and Intent under 50 (Model C *Vivid but Stuck*) | 15% | 0.9 | "1 in 5 sees the future but hasn't started" | "Offer one concrete first step." |
| fog | vision | Clarity under 40 | 15% | 0.75 | "1 in 5 can't picture their future yet" | "Start with a Future You session." |
| mapless | vision | Intent 70+ and Clarity under 50 (Model C *Moving Without a Map*) | 15% | 0.75 | "1 in 5 are moving without a clear goal" | "Help them name the goal first." |

Vision rules use fixed cuts, not the book's medians. Half of any book sits
under its own median, so a median cut would fire every time.

**Book vs. tier.** Advice about the invite (giving, purpose) only shows for
the whole book. Invitations go out before anyone has a tier, so a tier gets
advice for the conversation instead.

## Which four show (the selection rule)

1. **Score** every rule that fired:
   share of the group it's about × its weight × 0.8 if it's good news.
2. **The purpose card always leads.** It answers "who are they?"
3. **One card per topic.** The three vision rules share a topic, so only the
   strongest shows.
4. **No repeats.** Giving and status don't show when the purpose card already
   names that family.
5. **The other three slots** go to the highest scores. Ties go to the higher
   weight, then to the rule listed first.
6. If fewer than four fire, fewer show.

**Weights** say how directly a finding moves the advisor's next step. Belief
in an advisor (1.0) decides whether to ask for a meeting. Joy spend (0.7)
shapes the conversation but not whether to have one.

## Not included, and why

- **Comparisons with everyone on Knomee.** They have their own section below
  the cards.
- **KQ, Intent, Clarity, Receptivity per person.** These are table columns.
  Intent and Clarity are used only in combination (the vision rules).
- **Outlook concerns and hopes, Future You places and people.** Knomee asks
  them, but they aren't stored on prospect rows yet. Once they are, good
  next rules would be:
  - *Retirement fear*: "running out of money" in top concerns.
  - *Solo future*: Model D *Solo Future*.
  - *Travel dream*: travel among top hopes.

## Card titles

A card is titled by what it measures, not by what it found: the split (a pie)
and the action under it say what was found. One title per topic
(`TOPIC_TITLE` in `src/data/prospectGroup.ts`):

| Topic | Title |
|---|---|
| purpose | What their money is for |
| giving | Wanting to give back |
| status | Wanting status |
| posture | Confidence with money |
| advisor | Belief an advisor would help |
| resilience | Ability to weather a setback |
| goals | Confidence in reaching their goals |
| gap | Goal confidence vs. today's |
| permission | Permission to enjoy their money |
| joy | Spending on what brings joy |
| regret | Confidence in their money decisions |
| vision | Clarity about their future |

Each rule's `headline` still says its finding; the card doesn't show it.
