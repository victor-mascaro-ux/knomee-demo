# 🧭 Prospect Segmentation Model — Spec v2 (Schema-Driven)

**Version** 0.4 · **Date** 31 July 2026 · **Owner** Victor · **Status** For review
**Supersedes** v0.1 (free-text labels), v0.2 (separate marketing names per domain), v0.3 (no 'Other' handling)

---

## ⚡ TL;DR

**You were right — v1 didn't do this.** Model A's segments were reverse-engineered from words that happened to appear in these eight profiles. 39% of its scoring events came from free-text keyword matching. A prospect whose goal was *"buy out my business partner"* would have matched nothing and fallen to a silent default.

**v2 rebuilds every label as an exhaustive partition of the Adventure's closed option space.** The contract:

| # | Rule |
|---|---|
| 1 | Every label is an exhaustive, disjoint partition of an axis built from the declared option list |
| 2 | Any possible answer set resolves to a label — or to an explicit `Insufficient Signal`, never a silent default |
| 3 | Narrative free text **never** assigns a label. It may only enrich one |
| 4 | An **'Other' write-in may only resolve to an option that already exists.** If it cannot be placed, or is blank, it does not count anywhere |

**Proof:** 30,008 synthetic respondents drawn from the full option space — including all-"Other", all-floor, all-ceiling, single-tag and 15%-completion cases. **0 crashes, 0 unlabeled, every label reachable.** A mutation test scrambles every free-text field on the 8 real profiles: **all labels identical.**

**The finding that matters: v1 and v2 agree on 1 of 8 prospects.** Details in [§5](#-5-v1-vs-v2--the-most-important-finding).

---

## 🔍 1. What Was Wrong With v1

| Model | Structured from the schema? | Evidence |
|---|---|---|
| **C** Vision × Readiness | ✅ Yes | All inputs were closed scales and enums |
| **B** Purpose × Posture | ⚠️ Nearly | All 10 options mapped; `Other` unhandled |
| **A** Life Chapter | ❌ **No** | 39% of scoring events were free-text keyword hits |
| **D** Tension Tags | ❌ Partly | 32% of tags required free text |

v1's Model A looked for strings like `lake|cabin|renovat|work optional|give back`. That vocabulary was induced from eight people. It would have degraded silently — not loudly — on the ninth.

---

## 🗂️ 2. The Option Space

`schema.py` transcribes every closed option from the Adventure PDF. It's the contract, and a validator proves the partitions are total and disjoint on every run.

| Question | Type | Options |
|---|---|---|
| I want money to help me with | pick 1–3 | 10 + Other |
| Attention areas | 7 × 3-way | 7 areas × {+More, =Same, −Less} |
| Confidence | 6 items | each 1–5 |
| Where / doing / who is Future You | multi | 7 / 6 / 6 + Other each |
| How far in the future | single | 5 + Other |
| Ideal life includes | multi | **40 + Other** |
| Goal timeframe | single | 5 |
| Advisor support | single | 2 |
| Readiness — thought / steps / action | single | 4 each |

### 📌 The Life-Domain Partition

All 40 substantive *ideal life* options partition into **8 domains, each option in exactly one**:

| Domain | n | Options |
|---|---|---|
| Place & Setting | 14 | House, Apartment, City, Country, Suburb, Beach, Mountain, Ocean, Lake, Desert, Living abroad, Snowbird, RVing, Live near family |
| Culture & Creativity | 7 | Creative pursuits, Theater, Concerts, Music, Art, Museums, Going out |
| Home & Table | 4 | Staying home, Cooking, Entertaining, Pets |
| Health & Activity | 4 | Fitness, Sports, Outdoors, Health |
| Travel & Exploration | 3 | International travel, Domestic travel, Camping |
| People & Generations | 3 | Family, Friends, Grandchildren |
| Contribution | 3 | Volunteering, Philanthropic giving, Non-profit board work |
| Work & Enterprise | 2 | Gig work, Board room |

Money-purpose options partition the same way into 5 families + an `Unstated` residual, reached only when a prospect has **no** resolvable picks at all.

### 📌 "Other" Write-Ins

A client who picks *Other* and types something has told you something real. The policy:

| Rule | Detail |
|---|---|
| **Approximated toward a declared option** | A field-scoped lexicon places the text onto an option that already exists |
| **Never creates a new category** | A write-in cannot invent a label, widen a partition, or alter a domain |
| **If it cannot be placed, it does not count** | No match, or *Other* left blank → dropped **in every model, for every use case**. It does not inflate any count, denominator or score. The bare token *Other* never counts anywhere |
| **Every placement is logged** | What was written, which term matched, which option it became — visible in the trace, so a wrong approximation is findable rather than silent |
| **Multiple concepts all resolve** | *"a small town overseas"* carries a setting and a location; both are recorded. Overlapping matches collapse so *ski* and *skiing* cannot double-count the same span |

| Field | Client typed | Counts as |
|---|---|---|
| ideal life | golf and sailing | Sports, Outdoors |
| ideal life | second home in the mountains | House, Mountain |
| ideal life | RV trips to national parks | Domestic travel, RVing |
| ideal life | church | *— dropped, no declared option matches* |
| ideal life | *Other*, left blank | *— dropped, does not count* |
| money purpose | peace of mind | Security |
| money purpose | legacy for my kids | Supporting my family |
| money purpose | crypto moonshot | *— dropped* |
| Future You where | a small town overseas | In the country, Abroad |
| Future You with | my wife and buddies | Romantic partner, Friends |
| horizon | about 8 years | 5-10 years |

**Lexicon coverage:** 198 terms for ideal life (reaching all 40 options), 42 for money purpose (all 10), 31 for *who with*, 26 for *doing*, 23 for *where*. Horizon write-ins are parsed numerically.

**The dropped fragments are the point.** Ranked by frequency they are a backlog of options the Adventure is missing — *"church"*, *"on a boat"*, *"my dog"* (there is no pet option under *who is Future You with*). This is the highest-value output of the mechanism, not a failure of it.

⚠️ **The 8 sample profiles contain no write-ins**, so the resolver is evidenced only by its own 16-case test battery plus the synthetic proof run — not by real client data.

---

## 🏗️ 3. The Four Models, Rebuilt

### 🗺️ Model A — Life Domain

**Axis:** dominant life domain. **Inputs:** ideal-life tags (60%), attention shifts (25%), Future You *doing* (15%) — all closed.

**The label is the domain.** Earlier drafts gave each domain a marketing name ("Putting Down Roots" for Place & Setting). That created two names for one thing and invited them to drift apart. The domain names are now the labels, and an assertion in `models2.py` fails the build if the label set ever diverges from the partition in `schema.py`. The marketing line lives in the `hook` field, where it belongs.

| Life domain | n | What it means |
|---|---|---|
| **Place & Setting** | 14 | Vision anchored to a place — a home, a region, a setting |
| **Culture & Creativity** | 7 | Culture, creativity and expression carry the vision |
| **Home & Table** | 4 | Home as centre of gravity — cooking, hosting, being in it |
| **Health & Activity** | 4 | Being well enough to enjoy what comes next |
| **Travel & Exploration** | 3 | The vision is about going further |
| **People & Generations** | 3 | Relationships are the vision |
| **Contribution** | 3 | Impact beyond the household |
| **Work & Enterprise** | 2 | Work remains central, not something to escape |
| **Insufficient Signal** | — | Answered none of the three inputs. A data gap, not a segment |

**Scored as smoothed enrichment lift, not raw share.** Domains have unequal option counts. Raw share lets someone who picks both *Work & Enterprise* options score 1.00, while 7 of 14 *Place & Setting* scores 0.50. Lift asks instead: *is this domain over-represented among this person's picks, relative to chance?* Random-respondent balance improved from **6.1–18.5% → 10.6–18.1%**.

### 💛 Model B — Purpose × Posture

5 families (Protector, Liberator, Experiencer, Contributor, Achiever) + `Unstated`, × 4 postures (Assured ≥4.2, Working on it ≥3.2, Uneasy <3.2, Unrated). Exhaustive over all 10 options and the full 1–5 range. Inverse-frequency weighting retained — see [§6](#-6-model-comparison).

### 📊 Model C — Vision × Readiness

Unchanged in structure; free-text signals removed. **Vision** now reads only: clarity 1–5, count of ideal-life options, counts of where/doing/who, horizon set, postcard *completed* (presence, never content). **Readiness** reads the three transtheoretical enums, timeframe, and advisor preference. Cut points remain the **cohort median** — currently vision 82.1, readiness 35.7.

### 🔀 Model D — Tension Tags

Every rule now reads closed scales only. Three tags added that are detectable without free text:

| New tag | Rule |
|---|---|
| **Planning Aversion** | Financial Planning attention = −Less **and** advisor value ≥4 → delegation-ready |
| **Vision Fog** | Clarity ≤2 **and** fewer than 8 ideal-life options chosen |
| **Solo Future** | Future You *with* includes "Solo" → not a household plan |

Two v1 tags were **removed**, not rewritten — see [§4](#-4-what-the-adventure-cannot-detect).

---

## 🚫 4. What the Adventure Cannot Detect

v1's two most commercially interesting segments — *"Steadying the Ship"* (cash-flow pressure) and *"Caught in the Middle"* (caregiving) — **cannot be built from closed data today.** No question asks. v1 caught them by keyword, which meant it caught them only when someone happened to write about them.

Rather than fake it, these are logged as data gaps:

| Situation | In sample free text? | Suggested closed question |
|---|---|---|
| **Cash-flow pressure** | Yes — Luke, Kira, David | *"Is money tight right now?"* 1–5, in Outlook |
| **Caregiving for a parent** | Yes — Kira, Luke, Kristen, Matt | *"Who depends on you financially?"* multi-select: children / parents / other adults / no one |
| **Business exit** | Yes — Luke | *"Do you own a business you expect to sell?"* yes / no / n-a |
| **Health event** | No | *"Has your health changed in the past year?"* |
| **Windfall or loss** | Yes — David | *"Has your financial situation changed significantly in the past year?"* increased / decreased / about the same |

**Two questions — caregiving and cash-flow — would restore both segments on a sound footing.** This lines up with the earlier data-gap work (occupation, special-needs dependant, business exit).

---

## 🔬 5. v1 vs v2 — The Most Important Finding

Model A agrees on **1 of 8**. Model C — closed-scale in both versions — agrees on **6 of 8**.

| Prospect | v1 chapter (free-text) | v2 life domain (closed-only) | Their stated goal |
|---|---|---|---|
| Nicole H | Giving It Forward | Culture & Creativity | give back to places and things I like |
| Jeffrey H | Setting Up the Next Generation | Travel & Exploration | Fund kids education |
| Ashley S | Rooting a Place | Travel & Exploration *(+ People & Generations)* | House renovations |
| David S | Rooting a Place | Culture & Creativity | A lake house |
| Kira L | Widening the World | **Travel & Exploration** ✅ | annual summer sabbatical |
| Luke L | Caught in the Middle | Culture & Creativity *(+ Travel & Exploration)* | Get cash flow back positive |
| Matt B | Widening the World | Health & Activity | make work optional and travel |
| Kristen B | Rooting a Place | Travel & Exploration | Own a home in Lake Tahoe / Montana / Utah |

### 📌 Why They Diverge

**The written goal names the instrument. The closed answers describe the life.**

David writes *"a lake house."* His 22 ideal-life selections are dominated by Theater, Concerts, Music, Art, Museums, Creative pursuits, Going out — Culture & Creativity. The lake house is *how*; culture is *what for*.

Both readings are true. But:

- **v1 segmented on the instrument** — which only works when the prospect writes something your keyword list anticipated.
- **v2 segments on the life** — which works for every respondent, including the ones who write nothing at all.

This is worth deciding deliberately, not by accident. If you want the instrument in the segmentation, the honest route is a **closed goal-category question** (*"Which best describes your goal?"* — property / education / travel / business / giving / income / other), not keyword-matching prose.

---

## ⚖️ 6. Model Comparison

| Criterion | A · Life Domain | B · Purpose × Posture | C · Vision × Readiness | D · Tension Tags |
|---|---|---|---|---|
| Total coverage over option space | ✅ | ✅ | ✅ | ✅ |
| Every label reachable | ✅ 9/9 | ✅ 10/10 | ✅ 4/4 | ✅ 11/11 |
| Needs weighting patches to work | No | **Yes** | No | No |
| Degrades gracefully on thin data | Explicit gap label | No | **Yes** (continuous) | Yes |
| Maps to a marketing *action* | Theme | Tone | **Yes** — priority and spend | Creative angle |
| Competitors could replicate | Partly | Yes | Partly | **No** |
| Sample concentration (n=8) | 4/8 in one chapter ⚠️ | max 3/8 | max 3/8 | 2–5 tags each |

### ✅ Recommendation (unchanged from v1)

1. **C as the dashboard spine** — continuous axes, no mislabelling, maps to *who to call first*.
2. **A as the campaign filter** — "Vivid but Stuck × Culture & Creativity" is an ad brief.
3. **D as the creative layer** — the tension supplies the angle.
4. **Drop B**, keep the finding: 7 of 8 picked *Choice/Freedom*, 6 of 8 *Supporting my family*. An answer that universal is positioning, not targeting.

---

## ✅ 7. Verification

| Test | Result |
|---|---|
| Partition validity (total + disjoint) | ✅ 40/40 ideal-life options, 10/10 purpose options |
| Label set matches the partition | ✅ Enforced by assertion at import — Model A labels cannot drift from `schema.py` |
| Coverage proof, 30,008 synthetic respondents | ✅ 0 crashes, 0 unlabeled, all labels reachable |
| Free-text scrubbing of source code | ✅ No narrative free-text field referenced in any scoring path |
| **Mutation test** — scramble all narrative free text on the 8 real profiles | ✅ **All labels identical** |
| "Other" resolution battery — 16 cases | ✅ All pass |
| Invariant — a write-in can never create a new category | ✅ No invented options across every field |
| Invariant — bare "Other" never counts | ✅ Verified in all 5 multi-select fields |
| Coverage proof re-run with write-ins injected | ✅ 5,546 placed, 1,729 dropped, still 0 unlabeled |
| Unseen-option test — every option absent from the sample | ✅ All still resolve to a chapter |
| Determinism | ✅ Identical across runs |
| Traceability | ✅ Every label carries its reasons |

### 🐛 Bug Found During Verification

The unseen-option test reported *"International travel"* as absent from the sample. It isn't — the export writes **"International Travel"** and exact matching was **silently dropping it for every prospect who selected it.** A second variant, *"I want help from a wealth manager"* vs *"...from my advisor"*, appears across sheets.

All answers now canonicalise through case-insensitive matching plus a declared synonym table, and an `unmatched()` alarm reports any answer matching no declared option. **Dropped answers after the fix: 0.**

This is the failure mode worth guarding hardest — a dropped answer doesn't crash. It produces a clean-looking label built on less data than you think.

---

## 🚧 8. Limitations

| Limitation | Detail |
|---|---|
| **No conversion data** | Nothing here is validated against conversion. Every claim about which segments convert is a hypothesis. |
| **n = 8, from 4 households** | Effective n is closer to 4. **"Travel & Exploration" holds 4 of 8** — the Monte Carlo puts its base rate at 18%, so this is plausible, but confirm on real volume. |
| **Sample looks like clients, not prospects** | 7 of 8 rate advisor value 5/5 and want help. A cold book will skew far more to *Self-Directed* and *Not Yet Looking*. |
| **Model A depends on Future You completion** | 11.3% of synthetic respondents hit `Insufficient Signal`. Real drop-off may differ — instrument the funnel. |
| **The instrument/life split is unresolved** | §5 is a product decision, not a technical one. |

### Validation Plan

| Step | What | Kill criterion |
|---|---|---|
| 1 | Join labels to CRM outcomes, last 200+ Adventures | — |
| 2 | Conversion rate + lift by segment, per model | No spread beyond CI → drop the model |
| 3 | Stability re-score at n=50 / 100 / 200 | Labels churn → revisit cut points |
| 4 | Advisor face-validity, 5 advisors × 10 blind profiles | <60% agreement → revisit naming |
| 5 | Pilot: one campaign per layer vs. a niche-targeted control | — |

---

## 📁 9. Files

| File | Contents |
|---|---|
| `schema.py` | **The contract.** Every closed option, both partitions, self-validating |
| `lexicon.py` | "Other" write-in resolution — field-scoped term lexicons, self-validating |
| `test_other.py` | 16-case battery plus the never-invents and never-counts-blank invariants |
| `models2.py` | v2 scoring engine — closed options only |
| `prove.py` | Coverage proof over 30,008 synthetic respondents |
| `verify2.py` | Mutation test, unseen-option test, determinism, traceability |
| `Knomee_Segmentation_Dashboard.html` | Prototype — 4 models, coverage-proof tab, v1/v2 divergence |
| `Knomee_Segmentation_Models.xlsx` | Scored prospects, option space, proof, divergence, trace |
| `models.py` · `verify.py` | v1, retained for the comparison only |

---

## ❓ 10. Open Questions

1. **Instrument or life?** Should the goal category be part of the segmentation (needs a new closed question), or should segments describe the life the closed answers point at? §5 is the decision.
2. **Add the two questions?** Caregiving and cash-flow would restore the two most commercially interesting v1 segments.
3. **Where do Model C cut points sit** — per advisor, per firm, or Knomee-wide?
4. **Keep `Insufficient Signal` visible to marketing?** It's a funnel-completion metric wearing a segment's clothes.
5. **Is `Achiever` (Status) worth keeping** given nobody picked it? Reachable in proof, unobserved in sample.
6. **Who owns the lexicon?** It needs a review cadence — the unresolved backlog should be triaged periodically, with frequent fragments either added as lexicon terms or promoted to real Adventure options.
7. **Should a resolved write-in count as much as a direct selection?** Currently yes. An argument exists for weighting it slightly lower, since approximation carries more uncertainty than a click.
