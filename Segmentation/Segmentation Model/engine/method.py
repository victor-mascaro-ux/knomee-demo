# -*- coding: utf-8 -*-
"""Builds the 'How it's calculated' payload for the dashboard, with worked
examples computed from the real sample so the numbers on screen are live."""
import json
import models2 as M, schema as S, lexicon as L

profiles = json.load(open("profiles.json"))
res      = json.load(open("results2.json"))
meta     = res["_meta"]
N_IDEAL  = sum(len(o) for o in S.IDEAL_DOMAINS.values())
ALPHA    = 1.0

def worked_A(key="davidsmith"):
    p = profiles[key]
    ideal = M.sel(p, "fy_ideal", S.FY_IDEAL)
    rows = []
    for d, opts in S.IDEAL_DOMAINS.items():
        hit = [o for o in opts if o in ideal]
        exp = len(ideal) * len(opts) / N_IDEAL
        lift = (len(hit) + ALPHA) / (exp + ALPHA)
        rows.append({"domain": d, "size": len(opts), "hits": len(hit),
                     "expected": round(exp, 2), "lift": round(lift, 2),
                     "contrib": round(M.W_IDEAL * lift / 3.0, 3),
                     "picked": ", ".join(hit)})
    rows.sort(key=lambda r: -r["lift"])
    areas = [a for a in S.ATTENTION_TO_DOMAIN if M.attn(p, a) == 1]
    doing = M.sel(p, "fy_doing", S.FY_DOING)
    return {"who": key, "picks": len(ideal), "total": N_IDEAL, "rows": rows,
            "attention_more": areas, "doing": doing,
            "final": res[key]["A"]["all"], "segment": res[key]["A"]["segment"]}

def worked_C(key="kiralopez"):
    p = profiles[key]
    return {"who": key,
            "vision": res[key]["C"]["vision"], "readiness": res[key]["C"]["readiness"],
            "vision_reasons": res[key]["C"]["vision_reasons"],
            "readiness_reasons": res[key]["C"]["readiness_reasons"],
            "cuts": meta["c_cuts"], "basis": meta["c_basis"],
            "segment": res[key]["C"]["segment"]}

def worked_B(key="davidsmith"):
    p = profiles[key]
    picks = M.sel(p, "money_purpose", S.MONEY_PURPOSE)
    rows = []
    for i, o in enumerate(picks):
        fam = next((f for f, opts in S.PURPOSE_FAMILIES.items() if o in opts), "Unstated")
        w = max(meta["purpose_idf"].get(o, 1.0), 0.15)
        rows.append({"opt": o, "pos": i + 1, "rank": max(3 - i, 1), "family": fam,
                     "weight": round(w, 2), "points": round(max(3 - i, 1) * w, 2)})
    return {"who": key, "rows": rows, "all": res[key]["B"]["all"],
            "posture": res[key]["B"]["posture"], "mean": res[key]["B"]["posture_mean"],
            "segment": res[key]["B"]["segment"]}

METHOD = {
 "A": {
  "title": "Model A — Life Domain",
  "question": "Which life domain does this person's future vision point at?",
  "inputs": [
    ["Ideal life includes", f"{N_IDEAL} options, partitioned into {len(S.IDEAL_DOMAINS)} domains", f"{M.W_IDEAL:.0%} of the score"],
    ["Attention shifts", "7 areas, + More / = Same / − Less", f"{M.W_ATTN:.0%} of the score"],
    ["Future You is doing", "6 options mapped to domains", f"{M.W_DOING:.0%} of the score"],
  ],
  "steps": [
    ("1 · Count the hits per domain",
     "Each of the 40 ideal-life options belongs to exactly one domain. Count how many the person selected in each.",
     None),
    ("2 · Work out what chance would predict",
     "A domain with 14 options will collect more picks than one with 2, purely on size. So compute how many hits you'd expect if their picks were spread at random.",
     "expected = (their total picks) × (options in domain) ÷ 40"),
    ("3 · Score the over-representation, not the raw count",
     "Lift asks whether the domain is over-represented among THIS person's picks. The +1 on both sides shrinks small domains toward 1.0, so a single lucky pick in a 2-option domain can't dominate.",
     "lift = (hits + 1) ÷ (expected + 1)"),
    ("4 · Add the reinforcing signals",
     "Attention shifts marked '+ More' and Future You 'doing' selections both map to domains and add their weighted share.",
     "score = 0.60 × (lift ÷ 3) + 0.25 × attention share + 0.15 × doing share"),
    ("5 · Highest score wins; near-ties report both",
     "If the runner-up is within 0.08, both domains are reported. Two domains can genuinely be co-live. If none of the three inputs was answered, the result is 'Insufficient Signal' — never a silent default.",
     None),
  ],
  "example": worked_A(),
 },
 "B": {
  "title": "Model B — Purpose × Posture",
  "question": "Why does money matter to them, and how do they feel about it?",
  "inputs": [
    ["I want money to help me with", "10 options + Other, ranked 1–3", "Family axis"],
    ["Confidence items", "condition, resilience, goal belief, freedom from regret", "Posture axis"],
  ],
  "steps": [
    ("1 · Map each pick to a family",
     "All 10 options partition into 5 families. 'Other' or no answer resolves to 'Unstated'.",
     None),
    ("2 · Weight by position, then by distinctiveness",
     "First pick scores 3, second 2, third 1. Then multiply by an inverse-frequency weight: an option almost everyone picks tells you little about who this person is.",
     "weight = ln((n + 1) ÷ (times picked + 0.5))"),
    ("3 · Highest family wins",
     "Margins under 2 points are flagged rather than hidden.",
     None),
    ("4 · Posture from the confidence block",
     "Mean of four items, banded. No confidence answers at all resolves to 'Unrated'.",
     "Assured ≥ 4.2 · Working on it ≥ 3.2 · Uneasy < 3.2"),
  ],
  "example": worked_B(),
 },
 "C": {
  "title": "Model C — Vision × Readiness",
  "question": "How clearly can they see the destination, and how close are they to acting?",
  "inputs": [
    ["Vision clarity 1–5, ideal-life count, where/doing/who counts, horizon set, postcard completed", "all closed", "Vision axis, 0–100"],
    ["Readiness: thought / steps / action, goal timeframe, advisor preference", "all closed enums", "Readiness axis, 0–100"],
  ],
  "steps": [
    ("1 · Build the Vision score",
     "Clarity rating contributes up to 40, breadth of ideal-life selections up to 22, the where/what/who answers up to 23, horizon 8, postcard completion 7. The postcard's CONTENT is never read — only whether it was filled in.",
     None),
    ("2 · Build the Readiness score",
     "The three transtheoretical questions are ordered 4-point scales; position on each maps linearly. Thought 26, steps 26, action 30, timeframe up to 12, advisor preference 6.",
     "points = (position on the scale ÷ 3) × weight"),
    ("3 · Split at the cohort median, not a fixed number",
     "The Adventure is designed to elicit a vivid vision, so absolute vision scores skew high — the median here is "
     f"{meta['c_cuts']['vision']}. A fixed threshold would file almost everyone under 'vivid' and the axis would carry no information. "
     "Books under 6 profiles fall back to absolute cuts.",
     f"current cuts — vision {meta['c_cuts']['vision']} · readiness {meta['c_cuts']['readiness']} ({meta['c_basis']})"),
    ("4 · Quadrant by construction",
     "Above both cuts → Ready to Build. Vision only → Vivid but Stuck. Readiness only → Moving Without a Map. Neither → Not Yet Looking. Exhaustive by definition, so nobody is ever unlabeled.",
     None),
  ],
  "example": worked_C(),
 },
 "D": {
  "title": "Model D — Tension Tags",
  "question": "Where does what they want contradict what they believe or do?",
  "inputs": [
    ["Confidence items, vision clarity, readiness enums, attention shifts, advisor preference, Future You 'who'", "all closed", "Multi-label"],
  ],
  "steps": [
    ("1 · Each tag is a single explicit rule over closed answers",
     "No scoring, no thresholds to tune, no free text. A tag either fires or it doesn't, and the rule that fired is shown.",
     None),
    ("2 · Tags are not exclusive",
     "A prospect carries as many as apply — in this sample, between 1 and 5.",
     None),
    ("3 · A rule never fires on missing data",
     "Every rule checks that the items it reads were actually answered. An unanswered confidence item is never read as a low one.",
     None),
  ],
  "rules": [
    ["Deferred Joy", "Wants MORE on travel / hobbies / health AND spending-for-joy ≤ 3"],
    ["Confidence Gap", "Goal belief ≥ 4 AND min(condition, resilience) ≤ 3"],
    ["Vision-Action Gap", "Vision clarity ≥ 4 AND action = 'Not yet'"],
    ["Permission Gap", "min(condition, resilience) ≥ 4 AND spending-for-joy ≤ 3"],
    ["Decision Fatigue", "Freedom-from-regret ≤ 2"],
    ["Horizon Mismatch", "Goal within 5 years AND steps ≤ 'some ideas' AND no action taken"],
    ["Planning Aversion", "Financial-planning attention = − Less AND advisor value ≥ 4"],
    ["Vision Fog", "Vision clarity ≤ 2 AND fewer than 8 ideal-life options chosen"],
    ["Solo Future", "Future You 'who' includes Solo"],
    ["Advisor-Receptive", "Advisor value ≥ 4 AND asked for help with the goal"],
    ["Self-Directed", "Chose to pursue the goal without advisor support"],
  ],
  "example": None,
 },
}

OTHER = {
 "title": "How 'Other' write-ins are handled",
 "policy": [
  ["Approximated toward a declared option",
   "When a client picks 'Other' and types something, a field-scoped lexicon places it onto an option that already exists. 'golf and sailing' becomes Sports + Outdoors. 'second home in the mountains' becomes House + Mountain."],
  ["Never creates a new category",
   "A write-in can only ever resolve to something already in the option space. It cannot invent a label, widen a partition, or alter a domain."],
  ["If it cannot be placed, it does not count",
   "No match, or 'Other' left blank, and the answer is dropped entirely - in every model, for every use case. It does not inflate any count, any denominator, or any score. The bare token 'Other' never counts anywhere."],
  ["Every placement is logged",
   "What the client wrote, which term matched, and which option it resolved to - all visible in the per-prospect trace, so a wrong approximation is findable rather than silent."],
  ["Multiple concepts in one write-in all resolve",
   "'a small town overseas' carries a setting and a location; both are recorded. Overlapping matches collapse so 'ski' and 'skiing' cannot double-count the same span."],
 ],
 "lexicon_sizes": [[f, len(lx), len(set(lx.values())), len(L.UNIVERSES[f]) - 1]
                   for f, lx in L.LEXICONS.items()],
 "examples": [
  ["fy_ideal", "golf and sailing", "Sports, Outdoors"],
  ["fy_ideal", "second home in the mountains", "House, Mountain"],
  ["fy_ideal", "RV trips to national parks", "Domestic travel, RVing"],
  ["fy_ideal", "church", "— dropped, no declared option matches"],
  ["fy_ideal", "Other (blank)", "— dropped, does not count"],
  ["money_purpose", "peace of mind", "Security"],
  ["money_purpose", "legacy for my kids", "Supporting my family"],
  ["money_purpose", "crypto moonshot", "— dropped"],
  ["fy_where", "a small town overseas", "In the country, Abroad"],
  ["fy_with", "my wife and buddies", "Romantic partner, Friends"],
  ["fy_horizon", "about 8 years", "5-10 years"],
 ],
 "backlog_note": "Dropped write-ins are logged and counted. Ranked by frequency they are a backlog of options the Adventure is missing - the highest-value output of this mechanism, not a failure of it.",
}

CONTRACT = [
 ["Every label is an exhaustive, disjoint partition",
  "The 40 ideal-life options and the 10 money-purpose options each belong to exactly one group. A validator proves this on every run, and an assertion fails the build if the label set drifts from the partition."],
 ["Any answer set resolves to a label",
  "Verified against 30,008 synthetic respondents drawn from the full option space — including all-'Other', all-floor, all-ceiling, single-tag and 15%-completion cases. Zero crashes, zero unlabeled, every label reachable."],
 ["Narrative free text never assigns a label",
  "Goals, concerns, hopes and the postcard are read by advisors, not by the models. Scrambling every one of those fields on the 8 real profiles leaves all labels identical. The one exception is deliberate: text typed into an 'Other' box, which may only resolve to an option that already exists."],
 ["Missing data is never evidence",
  "Rules keyed on a low score check the item was answered first. Profiles under 55% field coverage are classified but flagged unreliable."],
 ["Answers are canonicalised before matching",
  "The export writes 'International Travel'; the schema declares 'International travel'. Exact matching silently dropped it. All answers now match case-insensitively against a synonym table, and an alarm reports anything matching no declared option."],
]

if __name__ == "__main__":
    json.dump({"method": METHOD, "contract": CONTRACT, "other": OTHER}, open("method.json", "w"), indent=1)
    print("method.json written")
    ex = METHOD["A"]["example"]
    print(f"  worked example A = {ex['who']}, {ex['picks']} picks, top lift "
          f"{ex['rows'][0]['domain']} {ex['rows'][0]['lift']}")
