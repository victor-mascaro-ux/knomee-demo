# -*- coding: utf-8 -*-
"""Battery for 'Other' write-in resolution. The sample contains no write-ins,
so this is the only evidence the resolver behaves."""
import models2 as M, schema as S

UNI={"fy_ideal":S.FY_IDEAL,"money_purpose":S.MONEY_PURPOSE,"fy_with":S.FY_WITH,
     "fy_where":S.FY_WHERE,"fy_doing":S.FY_DOING}

CASES=[  # field, write-in, expected resolved options (order-free), expect dropped?
 ("fy_ideal","golf and sailing",{"Sports","Outdoors"},False),
 ("fy_ideal","Other: reading, wine tasting",{"Creative pursuits","Going out"},False),
 ("fy_ideal","second home in the mountains",{"House","Mountain"},False),
 ("fy_ideal","RV trips to national parks",{"RVing","Domestic travel"},False),
 ("fy_ideal","grandkids and dogs",{"Grandchildren","Pets"},False),
 ("fy_ideal","church",set(),True),
 ("fy_ideal","",set(),False),
 ("fy_ideal","Other",set(),True),
 ("fy_ideal","quantum basket weaving",set(),True),
 ("money_purpose","peace of mind",{"Security"},False),
 ("money_purpose","legacy for my kids",{"Supporting my family"},False),
 ("money_purpose","crypto moonshot",set(),True),
 ("fy_with","my wife and buddies",{"Romantic partner","Friends"},False),
 ("fy_with","alone",{"Solo"},False),
 ("fy_where","a small town overseas",{"In the country","Abroad"},False),
 ("fy_doing","mentoring and consulting",{"Helping others","Running a business"},False),
]

fails=[]
print(f"{'FIELD':<14}{'WRITE-IN':<32}{'RESOLVED':<44}{'DROPPED':<26}")
print("-"*118)
for f,txt,exp,expdrop in CASES:
    out,tr,dead=M._resolve_field({f:[txt]},f,UNI[f])
    ok = set(out)==exp and (bool(dead)==expdrop)
    if not ok: fails.append((f,txt,set(out),exp,[d['wrote'] for d in dead],expdrop))
    print(f"{'OK ' if ok else 'FAIL'} {f:<10}{txt[:30]:<32}{(', '.join(out) or '— nothing'):<44}"
          f"{str([d['wrote'] or '(blank)' for d in dead])[:24]:<26}")

print("\nINVARIANT — a write-in can never create a new category")
bad=[]
for f,uni in UNI.items():
    for txt in ("something entirely new","a brand new life category","xyzzy"):
        out,_,_=M._resolve_field({f:[txt]},f,uni)
        bad += [o for o in out if o not in uni or o=="Other"]
print("   PASS  no invented options" if not bad else f"   FAIL  {bad}")
if bad: fails.append(("invent",bad,None,None,None,None))

print("\nINVARIANT — bare 'Other' never counts, in any field")
for f,uni in UNI.items():
    out,_,dead=M._resolve_field({f:["Other"]},f,uni)
    if out: fails.append((f,"bare Other",set(out),set(),None,None))
    print(f"   {f:<15} -> {out or 'nothing'}  (logged as dropped: {bool(dead)})")

print("\nINVARIANT — resolution is deterministic")
a=[M._resolve_field({'fy_ideal':['golf and sailing, second home']},'fy_ideal',S.FY_IDEAL)[0] for _ in range(5)]
print("   PASS  stable" if all(x==a[0] for x in a) else "   FAIL")

print("\n"+"="*66)
print(f"RESULT: {len(fails)} failure(s)")
for x in fails: print("  FAIL:",x)
print("="*66)
