# -*- coding: utf-8 -*-
"""Knomee segmentation v2 - every label defined over the CLOSED option space.

Contract:
  1. Every label is an exhaustive partition of an axis built from schema.py.
  2. Any possible set of answers resolves to a label, or to an explicit
     'Insufficient Signal' - never to a silent default.
  3. Free text NEVER assigns a label. It may only enrich one.
"""
import json, math
import schema as S
import lexicon as L

# ---------------------------------------------------------------- accessors
# Exported answers drift in case and wording ("International Travel" vs
# "International travel"; "wealth manager" vs "my advisor"). Exact matching
# silently DROPS those answers, which is worse than crashing - the label
# still looks clean. Everything is canonicalised through norm_opt instead.
SYNONYMS = {
 "i want help from a wealth manager.": "I want help from my advisor.",
 "i want to do it on my own":          "I want to do it on my own.",
}

def _canon(x, universe):
    k = str(x).strip().lower().rstrip(".")
    if k in SYNONYMS: return SYNONYMS[k]
    if k + "." in SYNONYMS: return SYNONYMS[k + "."]
    for o in universe:
        if o.strip().lower().rstrip(".") == k: return o
    return None

def sel(p, field, universe=None):
    """Declared options this person selected.

    'Other' write-ins are approximated toward a declared option via the
    lexicon. A write-in can never create a new category. If it cannot be
    placed - or 'Other' was left blank - it does not count as an option at
    all, in any model. The bare token 'Other' never counts.
    """
    return _resolve_field(p, field, universe)[0]

def _resolve_field(p, field, universe=None):
    v = p.get(field) or []
    if isinstance(v, str): v = [v]
    raw = [str(x).strip() for x in v if x and str(x).strip()]
    if not universe: return raw, [], []
    out, trail, dead = [], [], []
    for x in raw:
        if x.strip().lower() == "other":          # blank 'Other' - does not count
            dead.append({"wrote": "", "reason": "'Other' selected with no text"})
            continue
        c = _canon(x, universe)
        if c and c != "Other":
            if c not in out: out.append(c)
            continue
        if c == "Other":
            dead.append({"wrote": x, "reason": "'Other' selected with no text"})
            continue
        opts, tr, unres = L.resolve(x, field)     # a write-in - try to place it
        for o in opts:
            if o not in out: out.append(o)
        trail += tr
        dead += [{"wrote": u, "reason": "no declared option matches"} for u in unres]
    return out, trail, dead

def resolution_report(p):
    """Per-prospect audit of every 'Other' write-in: what was placed and what
    was dropped. Dropped fragments are the backlog of missing options."""
    res, dead = [], []
    for f, uni in (("fy_ideal", S.FY_IDEAL), ("fy_where", S.FY_WHERE),
                   ("fy_doing", S.FY_DOING), ("fy_with", S.FY_WITH),
                   ("money_purpose", S.MONEY_PURPOSE)):
        _, tr, dd = _resolve_field(p, f, uni)
        for t in tr:   res.append(dict(t, field=f))
        for d in dd:   dead.append(dict(d, field=f))
    return {"resolved": res, "dropped": dead}

def norm_opt(val, universe, default=None):
    """Map a raw answer onto a declared option, tolerant of case, punctuation
    and known wording variants."""
    if not val: return default
    c = _canon(val, universe)
    if c: return c
    k = str(val).strip().lower().rstrip(".")
    if k == "other": return default           # blank 'Other' never counts
    for o in universe:                        # prefix match for truncated exports
        if o.strip().lower()[:16] == k[:16]: return o
    if universe is S.FY_HORIZON:              # "about 8 years" -> "5-10 years"
        b, _ = L.resolve_horizon(val)
        if b: return b
    return default

def conf(p, k):
    v = (p.get("conf") or {}).get(k)
    return v if isinstance(v, int) else None

def attn(p, area):
    v = (p.get("attention") or {}).get(area)
    return v if v in (-1, 0, 1) else None

ORD = {"goal_thought": S.GOAL_THOUGHT, "goal_steps": S.GOAL_STEPS, "goal_action": S.GOAL_ACTION}
def ordinal(p, field):
    """Index of the answer within its declared ordered option list, or None."""
    o = norm_opt(p.get(field), ORD[field])
    return ORD[field].index(o) if o else None


# ================================================================== MODEL A
# LIFE CHAPTER - the dominant life domain the person's future vision points at.
# Axis: the 8-domain partition of the 40 'ideal life' options, reinforced by
# attention shifts and Future You 'doing'. All three inputs are closed options.
# Labels ARE the domain names. The taxonomy is the partition - naming it
# twice invites the two from drifting apart.
CHAPTER_OF_DOMAIN = {d: d for d in S.IDEAL_DOMAINS}

A_SEGMENTS = {
 "Place & Setting": dict(
   blurb="The future vision is anchored to a place - a home, a region, a setting.",
   hook="The address is the goal. Let's make the numbers meet it."),
 "Travel & Exploration": dict(
   blurb="The vision is about going further - travel, exploration, new ground.",
   hook="The window for this is open now. Let's use it."),
 "Culture & Creativity": dict(
   blurb="Culture, creativity and expression carry the vision - art, music, making things.",
   hook="Fund the part of life that isn't on the balance sheet."),
 "Home & Table": dict(
   blurb="Home as the centre of gravity - cooking, hosting, being in it rather than away from it.",
   hook="Make home the best place you spend money."),
 "Health & Activity": dict(
   blurb="Health, fitness and being physically able to enjoy what comes next.",
   hook="The plan only works if you're well enough to live it."),
 "People & Generations": dict(
   blurb="Relationships are the vision - family, friends, generations.",
   hook="Plan around the people, not the portfolio."),
 "Contribution": dict(
   blurb="Contribution beyond the household - volunteering, philanthropy, board work.",
   hook="Turn generosity into a plan with real impact."),
 "Work & Enterprise": dict(
   blurb="Work and enterprise remain central to the future, not something to escape.",
   hook="You're not winding down. Let's plan for what you're still building."),
 "Insufficient Signal": dict(
   blurb="Too few closed answers to place a chapter. Not a segment - a data gap.",
   hook="(no campaign - route back to complete the Adventure)"),
}

# Guard: the label set must stay identical to the partition it is built from.
assert set(A_SEGMENTS) - {"Insufficient Signal"} == set(S.IDEAL_DOMAINS), \
    "Model A labels have drifted from the ideal-life domain partition"

W_IDEAL, W_ATTN, W_DOING = 0.60, 0.25, 0.15

def score_A(p):
    ideal = sel(p, "fy_ideal", S.FY_IDEAL)
    doing = sel(p, "fy_doing", S.FY_DOING)
    dom_s = {d: 0.0 for d in S.IDEAL_DOMAINS}
    reasons = {d: [] for d in S.IDEAL_DOMAINS}
    answered = False

    # 1. ideal-life tags, scored as SMOOTHED ENRICHMENT LIFT.
    #    Raw share favours small domains: taking both 'Work & Enterprise'
    #    options scores 1.00, while taking 7 of 14 'Place & Setting' scores 0.50.
    #    Lift asks instead: is this domain over-represented among THIS person's
    #    picks, relative to how many options it offers? alpha=1 shrinks small
    #    domains toward 1.0 so a single lucky pick cannot dominate.
    N_IDEAL = sum(len(o) for o in S.IDEAL_DOMAINS.values())
    ALPHA = 1.0
    if ideal:
        answered = True
        for d, opts in S.IDEAL_DOMAINS.items():
            hit = [o for o in opts if o in ideal]
            expected = len(ideal) * len(opts) / N_IDEAL
            lift = (len(hit) + ALPHA) / (expected + ALPHA)
            dom_s[d] += W_IDEAL * (lift / 3.0)      # /3 keeps lift on a 0-1-ish scale
            if hit:
                reasons[d].append(f"Ideal life: {len(hit)} of {len(opts)} '{d}' options "
                                  f"({', '.join(hit[:4])}{'...' if len(hit)>4 else ''}); "
                                  f"expected {expected:.1f} by chance -> lift {lift:.2f}")
    # 2. attention shifts
    areas = [a for a in S.ATTENTION_TO_DOMAIN if attn(p, a) == 1]
    if any(attn(p, a) is not None for a in S.ATTENTION_AREAS):
        answered = True
        for a in areas:
            for d in S.ATTENTION_TO_DOMAIN[a]:
                inc = W_ATTN / len(S.ATTENTION_TO_DOMAIN[a])
                dom_s[d] += inc
                reasons[d].append(f"Wants MORE attention on '{a}' (+{inc:.2f})")
    # 3. Future You 'doing'
    if doing:
        answered = True
        for o in doing:
            for d in S.DOING_TO_DOMAIN.get(o, []):
                inc = W_DOING / max(len(doing), 1) * 2
                dom_s[d] += inc
                reasons[d].append(f"Future You is '{o}' (+{inc:.2f})")

    if not answered or max(dom_s.values()) <= 0:
        return "Insufficient Signal", None, 0.0, 0.0, [], {}
    rank = sorted(dom_s.items(), key=lambda x: -x[1])
    top, second = rank[0], rank[1]
    margin = top[1] - second[1]
    dual = CHAPTER_OF_DOMAIN[second[0]] if (second[1] > 0 and margin < 0.08) else None
    return (CHAPTER_OF_DOMAIN[top[0]], dual, round(top[1], 3), round(margin, 3),
            reasons[top[0]], {CHAPTER_OF_DOMAIN[d]: round(v, 3) for d, v in rank})


# ================================================================== MODEL B
# PURPOSE x POSTURE - exhaustive over all 10 money-purpose options and the
# full 1-5 confidence range. 'Other' resolves to an explicit residual.
B_FAMILIES = {
 "Protector":   dict(blurb="Money is a shield for the people they love.",
                     hook="Protect what you've built - and who's counting on it."),
 "Liberator":   dict(blurb="Money is optionality - a wider range of choices.",
                     hook="More options. Fewer obligations."),
 "Experiencer": dict(blurb="Money is fuel for living now.",
                     hook="Don't save the good life for later."),
 "Contributor": dict(blurb="Money is leverage for impact beyond the household.",
                     hook="Make your generosity go further."),
 "Achiever":    dict(blurb="Money marks and validates progress.",
                     hook="You've earned the position. Let's make it durable."),
 "Unstated":    dict(blurb="Chose 'Other' or skipped. Purpose not captured by the option set.",
                     hook="(no campaign - candidate for an added option)"),
}
B_POSTURES = {
 "Assured":       "Feels in control. Sells on ambition, not reassurance.",
 "Working on it": "Broadly capable with live doubts. Sells on partnership and clarity.",
 "Uneasy":        "Confidence is the bottleneck, not the balance sheet. Sells on relief.",
 "Unrated":       "Confidence block not completed. Posture unknown.",
}

def purpose_idf(profiles):
    n = len(profiles) or 1
    c = {}
    for p in profiles:
        for o in sel(p, "money_purpose", S.MONEY_PURPOSE):
            c[o] = c.get(o, 0) + 1
    return {o: round(math.log((n + 1) / (v + 0.5)), 3) for o, v in c.items()}

def score_B(p, idf=None):
    picks = sel(p, "money_purpose", S.MONEY_PURPOSE)
    Sc = {f: 0.0 for f in B_FAMILIES}; R = {f: [] for f in B_FAMILIES}
    for i, o in enumerate(picks):
        rank = max(3 - i, 1)
        fam = next((f for f, opts in S.PURPOSE_FAMILIES.items() if o in opts), "Unstated")
        w = 1.0 if idf is None else max(idf.get(o, 1.0), 0.15)
        Sc[fam] += rank * w
        R[fam].append(f"'{o}' at rank {i+1}" + (f", distinctiveness {w:.2f}" if idf else "")
                      + f" (+{rank*w:.2f})")
    if not picks:
        Sc["Unstated"] = 0.01; R["Unstated"].append("No money-purpose answer recorded")
    rank_ = sorted(Sc.items(), key=lambda x: -x[1])
    return rank_, R

def posture_B(p):
    vals = [conf(p, k) for k in ("condition", "resilience", "goal_belief", "regret_never")]
    vals = [v for v in vals if v is not None]
    if not vals: return "Unrated", None
    m = sum(vals) / len(vals)
    return ("Assured" if m >= 4.2 else "Working on it" if m >= 3.2 else "Uneasy"), round(m, 2)


# ================================================================== MODEL C
# VISION x READINESS - continuous axes over closed scales only.
C_SEGMENTS = {
 "Ready to Build": dict(
   blurb="Clear picture, already moving. Shortest path to a signed client.",
   hook="You know where you're going. Let's build the plan that gets you there.",
   action="Highest-priority outreach. Lead with capability and speed."),
 "Vivid but Stuck": dict(
   blurb="Detailed future, no first step taken. Blocked by how, not whether.",
   hook="You can already see it. Here's the first move.",
   action="Best nurture audience. Lead with a concrete first step."),
 "Moving Without a Map": dict(
   blurb="Acting, but the destination is fuzzy. Risk of optimising toward the wrong thing.",
   hook="You're doing the work. Let's point it at the right life.",
   action="Strong advisor fit. Lead with direction-setting."),
 "Not Yet Looking": dict(
   blurb="Neither vision nor plan formed. Genuine top-of-funnel.",
   hook="Start with what you actually want.",
   action="Long nurture. Lead with the Adventure itself."),
}
C_ABS = {"vision": 55.0, "readiness": 45.0}

def vision_score(p):
    R = []; s = 0.0
    v = conf(p, "_") if False else p.get("fy_vivid")
    if isinstance(v, int):
        pts = (v - 1) / 4 * 40; s += pts; R.append(f"Vision clarity {v}/5 (+{pts:.0f})")
    n = len(sel(p, "fy_ideal", S.FY_IDEAL))
    pts = min(n / 20, 1) * 22; s += pts
    R.append(f"{n} of {len(S.FY_IDEAL)-1} ideal-life options selected (+{pts:.0f})")
    for f, univ, w, lbl in (("fy_where", S.FY_WHERE, 8, "where"),
                            ("fy_doing", S.FY_DOING, 8, "what"),
                            ("fy_with",  S.FY_WITH,  7, "who")):
        k = len(sel(p, f, univ))
        if k: pts = min(k / 3, 1) * w; s += pts; R.append(f"Future You '{lbl}': {k} selected (+{pts:.0f})")
    if norm_opt(p.get("fy_horizon"), S.FY_HORIZON):
        s += 8; R.append(f"Horizon set to '{p.get('fy_horizon')}' (+8)")
    if (p.get("fy_postcard") or "").strip():
        s += 7; R.append("Postcard completed (+7)")   # completion only, content unread
    return min(s, 100), R

READY_W = {"goal_thought": 26, "goal_steps": 26, "goal_action": 30}
def readiness_score(p):
    R = []; s = 0.0
    for f, w in READY_W.items():
        lv = ordinal(p, f)
        if lv is None: R.append(f"{f}: not answered (+0)"); continue
        pts = lv / 3 * w; s += pts
        R.append(f"{f}: '{ORD[f][lv]}' = level {lv}/3 (+{pts:.0f})")
    gw = norm_opt(p.get("goal_when"), S.GOAL_WHEN)
    if gw:
        idx = S.GOAL_WHEN.index(gw); pts = [12, 10, 7, 5, 3][idx]
        s += pts; R.append(f"Timeframe '{gw}' (+{pts})")
    ga = norm_opt(p.get("goal_advisor_pref"), S.GOAL_ADVISOR)
    if ga == S.GOAL_ADVISOR[1]:
        s += 6; R.append("Wants advisor help with this goal (+6)")
    return min(s, 100), R

def c_quadrant(v, r, cuts):
    return ("Ready to Build"       if v >= cuts["vision"] and r >= cuts["readiness"] else
            "Vivid but Stuck"      if v >= cuts["vision"] else
            "Moving Without a Map" if r >= cuts["readiness"] else
            "Not Yet Looking")

def cohort_cuts(profiles):
    vs = sorted(vision_score(p)[0] for p in profiles)
    rs = sorted(readiness_score(p)[0] for p in profiles)
    if len(vs) < 6: return dict(C_ABS), "absolute (book too small for a stable median)"
    med = lambda a: a[len(a)//2] if len(a) % 2 else (a[len(a)//2-1] + a[len(a)//2]) / 2
    return {"vision": round(med(vs), 1), "readiness": round(med(rs), 1)}, "cohort median"


# ================================================================== MODEL D
# TENSION TAGS - every rule reads only closed scales and enums.
D_TAGS = {
 "Deferred Joy":      dict(blurb="Wants more of what brings joy but won't spend on it.",
                           hook="The things you love shouldn't be the first thing cut."),
 "Confidence Gap":    dict(blurb="Believes in the goal but doubts the current footing.",
                           hook="You believe you'll get there. Let's make today's numbers agree."),
 "Vision-Action Gap": dict(blurb="Vivid future, no first step taken. Largest conversion opportunity.",
                           hook="You've done the hard part - imagining it. Here's step one."),
 "Permission Gap":    dict(blurb="Secure but still won't spend on joy. Needs permission, not capacity.",
                           hook="You can afford this. Here's the proof."),
 "Decision Fatigue":  dict(blurb="Second-guesses decisions regardless of outcome.",
                           hook="Stop re-litigating every decision."),
 "Horizon Mismatch":  dict(blurb="Near-term goal date with no plan behind it.",
                           hook="Your timeline is closer than your plan."),
 "Planning Aversion": dict(blurb="Wants less time on financial admin but rates advisors highly. Delegation-ready.",
                           hook="Hand it over. That's what we're for."),
 "Vision Fog":        dict(blurb="Cannot picture the future yet - low clarity and few elements chosen.",
                           hook="Before the plan, the picture."),
 "Solo Future":       dict(blurb="Future You is alone. Different planning needs from a household plan.",
                           hook="A plan built around you, not a household."),
 "Advisor-Receptive": dict(blurb="Rates advisors highly and asked for help.",
                           hook="Ready for a partner."),
 "Self-Directed":     dict(blurb="Prefers to go it alone. Advisory framing will meet resistance.",
                           hook="Lead with tools and insight, not a service pitch."),
}

# Situations the Adventure CANNOT currently detect from any closed question.
UNDETECTABLE = {
 "Cash-flow pressure":  "No closed question asks whether money is tight right now.",
 "Caregiving for a parent": "No closed question asks about dependants in either direction.",
 "Business exit / liquidity event": "No closed question asks about ownership or an exit.",
 "Health event": "No closed question asks about a health change.",
 "Recent windfall or loss": "No closed question asks about a change in circumstances.",
}

def score_D(p):
    out = []
    def tag(n, w): out.append({"tag": n, "why": w})
    c = lambda k: conf(p, k)

    joy_areas = [a for a in ("Travel & Adventure", "Hobbies & Interests", "Health & Wellness")
                 if attn(p, a) == 1]
    if joy_areas and c("joy_spend") is not None and c("joy_spend") <= 3:
        tag("Deferred Joy", f"Wants MORE attention on {', '.join(joy_areas)} "
                            f"but scores {c('joy_spend')}/5 on spending for joy")
    if None not in (c("goal_belief"), c("condition"), c("resilience")) \
       and c("goal_belief") >= 4 and min(c("condition"), c("resilience")) <= 3:
        tag("Confidence Gap", f"Goal belief {c('goal_belief')}/5 but condition {c('condition')}/5, "
                              f"resilience {c('resilience')}/5")
    if isinstance(p.get("fy_vivid"), int) and p["fy_vivid"] >= 4 and ordinal(p, "goal_action") == 0:
        tag("Vision-Action Gap", f"Vision clarity {p['fy_vivid']}/5 but action = '{S.GOAL_ACTION[0]}'")
    if None not in (c("condition"), c("resilience"), c("joy_spend")) \
       and min(c("condition"), c("resilience")) >= 4 and c("joy_spend") <= 3:
        tag("Permission Gap", f"Condition {c('condition')}/5 and resilience {c('resilience')}/5 "
                              f"but joy-spending {c('joy_spend')}/5")
    if c("regret_never") is not None and c("regret_never") <= 2:
        tag("Decision Fatigue", f"Freedom-from-regret {c('regret_never')}/5")
    gw = norm_opt(p.get("goal_when"), S.GOAL_WHEN)
    if gw in S.GOAL_WHEN[:2] and ordinal(p, "goal_steps") in (0, 1) and ordinal(p, "goal_action") == 0:
        tag("Horizon Mismatch", f"Goal set '{gw}' but steps = '{p.get('goal_steps')}' and no action taken")
    if attn(p, "Financial Planning & Management") == -1 and c("advisor_value") is not None \
       and c("advisor_value") >= 4:
        tag("Planning Aversion", f"Wants LESS attention on financial planning while rating "
                                 f"advisor value {c('advisor_value')}/5")
    if isinstance(p.get("fy_vivid"), int) and p["fy_vivid"] <= 2 \
       and len(sel(p, "fy_ideal", S.FY_IDEAL)) < 8:
        tag("Vision Fog", f"Vision clarity {p['fy_vivid']}/5 with only "
                          f"{len(sel(p,'fy_ideal',S.FY_IDEAL))} ideal-life elements chosen")
    if "Solo" in sel(p, "fy_with", S.FY_WITH):
        tag("Solo Future", "Future You selected 'Solo'")
    ga = norm_opt(p.get("goal_advisor_pref"), S.GOAL_ADVISOR)
    if ga == S.GOAL_ADVISOR[1] and c("advisor_value") is not None and c("advisor_value") >= 4:
        tag("Advisor-Receptive", f"Advisor value {c('advisor_value')}/5 and asked for help")
    elif ga == S.GOAL_ADVISOR[0]:
        tag("Self-Directed", "Chose to pursue this goal without advisor support")
    return out


# ================================================================== coverage
COVERAGE_FIELDS = ["money_purpose","attention","conf","fy_where","fy_doing","fy_with",
                   "fy_horizon","fy_ideal","fy_vivid","goal_when","goal_advisor_pref",
                   "goal_thought","goal_steps","goal_action"]
MIN_COVERAGE = 55

def coverage(p):
    filled = [f for f in COVERAGE_FIELDS if p.get(f) not in (None, "", [], {})]
    return round(len(filled)/len(COVERAGE_FIELDS)*100), [f for f in COVERAGE_FIELDS if f not in filled]


def classify(p, cuts=None, idf=None):
    cov, miss = coverage(p)
    a_seg, a_dual, a_score, a_margin, a_reasons, a_all = score_A(p)
    b_rank, b_reasons = score_B(p, idf)
    post, post_m = posture_B(p)
    v, vr = vision_score(p); r, rr = readiness_score(p)
    cuts = cuts or C_ABS
    return {
      "A": {"segment": a_seg, "secondary": a_dual, "score": a_score, "margin": a_margin,
            "reasons": a_reasons, "all": a_all,
            "confident": a_seg != "Insufficient Signal" and cov >= MIN_COVERAGE and a_margin >= 0.08},
      "B": {"family": b_rank[0][0], "posture": post, "posture_mean": post_m,
            "segment": f"{post} {b_rank[0][0]}", "score": round(b_rank[0][1], 2),
            "runner_up": b_rank[1][0], "margin": round(b_rank[0][1]-b_rank[1][1], 2),
            "reasons": b_reasons[b_rank[0][0]],
            "all": {k: round(x, 2) for k, x in b_rank},
            "confident": cov >= MIN_COVERAGE and (b_rank[0][1]-b_rank[1][1]) >= 2},
      "C": {"segment": c_quadrant(v, r, cuts), "vision": round(v, 1), "readiness": round(r, 1),
            "vision_reasons": vr, "readiness_reasons": rr, "cuts": cuts,
            "confident": cov >= MIN_COVERAGE and abs(v-cuts["vision"]) >= 8
                         and abs(r-cuts["readiness"]) >= 8},
      "D": {"tags": score_D(p)},
      "coverage": cov, "missing": miss, "reliable": cov >= MIN_COVERAGE,
    }
