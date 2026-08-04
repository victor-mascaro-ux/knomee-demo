# -*- coding: utf-8 -*-
"""Coverage proof: does EVERY possible set of answers resolve to a label?

Monte Carlo over the declared option space, plus hand-built adversarial cases.
"""
import random, json, collections
import schema as S, models2 as M, lexicon as L

random.seed(7)

# Field-scoped, because the lexicons are field-scoped. Feeding a money-purpose
# phrase into fy_ideal would inflate the "unresolved" backlog with noise that
# says nothing about missing options.
WRITEINS = {
 "fy_ideal": ["golf", "Other: reading and wine", "second home in the mountains", "church",
              "quantum basket weaving", "Other", "grandkids and dogs", "",
              "RV trips to national parks", "beekeeping"],
 "fy_where": ["a small town overseas", "on a boat", "Other", "ski town", ""],
 "fy_doing": ["mentoring and consulting", "studying philosophy", "Other", "writing"],
 "fy_with": ["my wife and buddies", "my dog", "Other", "alone"],
 "money_purpose": ["peace of mind", "legacy for my kids", "crypto moonshot", "Other", ""],
}

def rand_profile(rng, density=1.0):
    """A synthetic respondent drawn from the declared option space.
    density < 1 simulates partial completion."""
    def maybe(v): return v if rng.random() < density else None
    p = {}
    p["money_purpose"] = maybe(rng.sample(S.MONEY_PURPOSE, rng.randint(1, 3))) or []
    at = {}
    for a in S.ATTENTION_AREAS:
        v = maybe(rng.choice([1, 0, -1]))
        if v is not None: at[a] = v
    p["attention"] = at
    p["conf"] = {k: v for k in S.CONFIDENCE_ITEMS if (v := maybe(rng.choice(S.LIKERT))) is not None}
    p["fy_where"] = maybe(rng.sample(S.FY_WHERE, rng.randint(1, 4))) or []
    p["fy_doing"] = maybe(rng.sample(S.FY_DOING, rng.randint(1, 4))) or []
    p["fy_with"]  = maybe(rng.sample(S.FY_WITH,  rng.randint(1, 4))) or []
    p["fy_horizon"] = maybe(rng.choice(S.FY_HORIZON))
    p["fy_ideal"] = maybe(rng.sample(S.FY_IDEAL, rng.randint(1, 25))) or []
    # 1 in 4 respondents adds an 'Other' write-in somewhere
    if rng.random() < 0.25:
        f = rng.choice(list(WRITEINS))
        p.setdefault(f, [])
        if isinstance(p[f], list): p[f] = list(p[f]) + [rng.choice(WRITEINS[f])]
    p["fy_vivid"] = maybe(rng.choice(S.LIKERT))
    p["fy_postcard"] = maybe(rng.choice(["", "some text"]))
    p["goal_when"] = maybe(rng.choice(S.GOAL_WHEN))
    p["goal_advisor_pref"] = maybe(rng.choice(S.GOAL_ADVISOR))
    p["goal_thought"] = maybe(rng.choice(S.GOAL_THOUGHT))
    p["goal_steps"]   = maybe(rng.choice(S.GOAL_STEPS))
    p["goal_action"]  = maybe(rng.choice(S.GOAL_ACTION))
    return p

N = 30000
rng = random.Random(7)
seenA = collections.Counter(); seenB = collections.Counter()
seenC = collections.Counter(); seenD = collections.Counter()
unlabeled = collections.Counter(); crashes = []
dropped_writeins = collections.Counter(); resolved_writeins = collections.Counter()
insufficient = 0

cases = []
for i in range(N):
    d = rng.choice([1.0, 1.0, 1.0, 0.85, 0.6, 0.35, 0.15])
    cases.append(rand_profile(rng, d))

# adversarial edge cases
cases.append({})                                                   # nothing at all
cases.append({"money_purpose": ["Other"], "fy_ideal": ["Other"],
              "fy_where": ["Other"], "fy_doing": ["Other"], "fy_with": ["Other"]})  # all Other
cases.append({"conf": {k: 1 for k in S.CONFIDENCE_ITEMS}, "fy_vivid": 1,
              "fy_ideal": [], "attention": {a: -1 for a in S.ATTENTION_AREAS}})     # floor
cases.append({"conf": {k: 5 for k in S.CONFIDENCE_ITEMS}, "fy_vivid": 5,
              "fy_ideal": [o for o in S.FY_IDEAL if o != "Other"],
              "attention": {a: 1 for a in S.ATTENTION_AREAS},
              "money_purpose": S.MONEY_PURPOSE[:3], "fy_where": S.FY_WHERE[:3],
              "fy_doing": S.FY_DOING[:3], "fy_with": S.FY_WITH[:3],
              "fy_horizon": S.FY_HORIZON[0], "goal_when": S.GOAL_WHEN[0],
              "goal_advisor_pref": S.GOAL_ADVISOR[1], "goal_thought": S.GOAL_THOUGHT[3],
              "goal_steps": S.GOAL_STEPS[3], "goal_action": S.GOAL_ACTION[3]})      # ceiling
cases.append({"fy_ideal": ["Board room", "Gig work"]})             # smallest domain only
cases.append({"fy_ideal": ["House"]})                              # single tag, largest domain
cases.append({"attention": {a: 1 for a in S.ATTENTION_AREAS}})     # attention only
cases.append({"fy_doing": ["Helping others"]})                     # doing only
cases.append({"fy_ideal": ["Other"], "money_purpose": ["Other"],
              "fy_where": ["Other"], "fy_doing": ["Other"], "fy_with": ["Other"]})  # blank Other everywhere
cases.append({"fy_ideal": ["quantum basket weaving", "beekeeping"],
              "money_purpose": ["crypto moonshot"]})                # unresolvable write-ins only
cases.append({"fy_ideal": ["golf and sailing", "second home in the mountains"],
              "money_purpose": ["peace of mind"]})                  # resolvable write-ins only

for p in cases:
    try:
        r = M.classify(p, M.C_ABS, None)
    except Exception as e:
        crashes.append((p, repr(e))); continue
    for m, key, bag in (("A", "segment", seenA), ("B", "segment", seenB), ("C", "segment", seenC)):
        lab = r[m][key]
        if not lab: unlabeled[m] += 1
        bag[lab] += 1
    if r["A"]["segment"] == "Insufficient Signal": insufficient += 1
    for t in r["D"]["tags"]: seenD[t["tag"]] += 1
    rep = M.resolution_report(p)
    for d in rep["dropped"]:
        if d["wrote"]: dropped_writeins[d["wrote"]] += 1
    for x in rep["resolved"]: resolved_writeins[x["resolved_to"]] += 1

n = len(cases)
print("=" * 76)
print(f"COVERAGE PROOF - {n:,} synthetic respondents drawn from the declared option space")
print("=" * 76)
print(f"  Crashes ............... {len(crashes)}")
print(f"  Unlabeled ............. {sum(unlabeled.values())}")
print(f"  'Insufficient Signal' . {insufficient} ({insufficient/n*100:.2f}%)  <- explicit, never silent")
print()

print("MODEL A - are all 9 labels reachable?")
for lab in list(M.A_SEGMENTS):
    c = seenA.get(lab, 0)
    print(f"  {'REACHABLE  ' if c else 'UNREACHABLE'} {lab:<24} {c:>7,}  {c/n*100:5.1f}%")
missA = [l for l in M.A_SEGMENTS if not seenA.get(l)]

print("\nMODEL B - are all 6 families x 4 postures reachable?")
fams = collections.Counter(l.rsplit(" ", 1)[-1] if False else l for l in seenB)
for fam in M.B_FAMILIES:
    c = sum(v for k, v in seenB.items() if k.endswith(fam))
    print(f"  {'REACHABLE  ' if c else 'UNREACHABLE'} {fam:<24} {c:>7,}  {c/n*100:5.1f}%")
for post in M.B_POSTURES:
    c = sum(v for k, v in seenB.items() if k.startswith(post))
    print(f"  {'REACHABLE  ' if c else 'UNREACHABLE'} posture: {post:<15} {c:>7,}  {c/n*100:5.1f}%")
missB = [f for f in M.B_FAMILIES if not sum(v for k, v in seenB.items() if k.endswith(f))] \
      + [p for p in M.B_POSTURES if not sum(v for k, v in seenB.items() if k.startswith(p))]

print("\nMODEL C - are all 4 quadrants reachable?")
for lab in M.C_SEGMENTS:
    c = seenC.get(lab, 0)
    print(f"  {'REACHABLE  ' if c else 'UNREACHABLE'} {lab:<24} {c:>7,}  {c/n*100:5.1f}%")
missC = [l for l in M.C_SEGMENTS if not seenC.get(l)]

print("\nMODEL D - are all 11 tags reachable?")
for lab in M.D_TAGS:
    c = seenD.get(lab, 0)
    print(f"  {'REACHABLE  ' if c else 'UNREACHABLE'} {lab:<24} {c:>7,}  {c/n*100:5.1f}%")
missD = [l for l in M.D_TAGS if not seenD.get(l)]

print("\nOTHER WRITE-INS")
print(f"  Resolved onto a declared option ... {sum(resolved_writeins.values()):,}")
print(f"  Dropped (no match / blank) ....... {sum(dropped_writeins.values()):,}")
print("  Top unresolved fragments — the backlog of options the Adventure is missing:")
for w, c in dropped_writeins.most_common(6): print(f"    {c:>6,}  {w!r}")

print()
print("=" * 76)
bad = len(crashes) + sum(unlabeled.values()) + len(missA) + len(missB) + len(missC) + len(missD)
print(f"RESULT: {'PASS - total coverage, every label reachable' if bad == 0 else 'FAIL'}")
for c in crashes[:3]: print("   CRASH:", c[1])
for x in missA + missB + missC + missD: print("   UNREACHABLE:", x)
print("=" * 76)

json.dump({"n": n, "crashes": len(crashes), "unlabeled": sum(unlabeled.values()),
           "insufficient": insufficient,
           "A": dict(seenA), "B": dict(seenB), "C": dict(seenC), "D": dict(seenD),
           "missing": missA + missB + missC + missD,
           "writeins_resolved": dict(resolved_writeins),
           "writeins_dropped": dict(dropped_writeins)}, open("proof.json", "w"), indent=1)
