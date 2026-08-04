# -*- coding: utf-8 -*-
"""v2 verification: no free text in any label decision; determinism; traceability."""
import json, re, inspect
import models2 as M, schema as S

profiles=json.load(open("profiles.json")); res=json.load(open("results2.json"))
cuts=res["_meta"]["c_cuts"]; idf=res["_meta"]["purpose_idf"]
fails=[]

print("1. NO FREE TEXT MAY INFLUENCE A LABEL")
FREE_FIELDS=["goal_text","goal_why","goal_worth","goal_challenge","concerns","hopes",
             "joy_experience","joy_why","fy_postcard"]
src=inspect.getsource(M)
# strip the postcard completion check, which reads presence only, never content
body=src.replace('if (p.get("fy_postcard") or "").strip():','if PRESENCE_ONLY:')
used=[f for f in FREE_FIELDS if f in body]
print(f"   Free-text fields referenced in scoring code: {used or 'NONE'}")
if used: fails.append(f"Free-text fields still read: {used}")
else: print("   PASS  No free-text field influences any label")

print("\n2. FREE TEXT MUTATION TEST — scramble every free-text field, labels must not move")
mut={}
for k,p in profiles.items():
    q=dict(p)
    for f in FREE_FIELDS:
        if isinstance(q.get(f),list): q[f]=["zzz nonsense qqq"]*len(q[f])
        elif q.get(f): q[f]="zzz nonsense qqq"
    mut[k]=M.classify(q,cuts,idf)
moved=[k for k in profiles if (mut[k]["A"]["segment"],mut[k]["B"]["segment"],
        mut[k]["C"]["segment"],sorted(t["tag"] for t in mut[k]["D"]["tags"]))
      !=(res[k]["A"]["segment"],res[k]["B"]["segment"],res[k]["C"]["segment"],
         sorted(t["tag"] for t in res[k]["D"]["tags"]))]
print(f"   Prospects whose label changed: {len(moved)} {moved}")
if moved: fails.append(f"Labels moved under free-text scrambling: {moved}")
else: print("   PASS  All 8 labels identical with free text destroyed")

print("\n3. UNKNOWN-ANSWER TEST — options never seen in the sample must still route")
never=[o for o in S.FY_IDEAL if o not in
       {x for p in profiles.values() for x in (p.get("fy_ideal") or [])}]
print(f"   Ideal-life options absent from the sample: {len(never)} — {', '.join(never[:8])}...")
for o in never:
    if o=="Other": continue
    r=M.classify({"fy_ideal":[o]},cuts,idf)
    if r["A"]["segment"]=="Insufficient Signal":
        fails.append(f"Unseen option '{o}' produced no chapter")
print("   PASS  Every option unseen in the sample still resolves to a chapter"
      if not fails else "   FAIL")

print("\n4. UNSEEN MONEY-PURPOSE OPTIONS")
seen={x for p in profiles.values() for x in (p.get("money_purpose") or [])}
for o in S.MONEY_PURPOSE:
    r=M.classify({"money_purpose":[o]},cuts,idf)
    fam=r["B"]["family"]
    mark="(unseen in sample)" if o not in seen else ""
    print(f"   {o:<28} -> {fam:<12} {mark}")
    if o!="Other" and fam=="Unstated": fails.append(f"'{o}' did not map to a family")

print("\n5. DETERMINISM")
a=json.dumps({k:M.classify(p,cuts,idf) for k,p in profiles.items()},sort_keys=True)
b=json.dumps({k:M.classify(p,cuts,idf) for k,p in profiles.items()},sort_keys=True)
print("   PASS  Deterministic" if a==b else "   FAIL")
if a!=b: fails.append("Non-deterministic")

print("\n6. TRACEABILITY")
for k in profiles:
    if not res[k]["A"]["reasons"] and res[k]["A"]["segment"]!="Insufficient Signal":
        fails.append(f"{k}/A no reasons")
    if not res[k]["C"]["vision_reasons"]: fails.append(f"{k}/C no vision reasons")
    for t in res[k]["D"]["tags"]:
        if not t.get("why"): fails.append(f"{k}/D {t['tag']} no rationale")
print("   PASS  Every label carries traceable reasons" if not fails else "   FAIL")

print("\n" + "="*66)
print(f"RESULT: {len(fails)} failure(s)")
for f in fails: print("  FAIL:",f)
print("="*66)
