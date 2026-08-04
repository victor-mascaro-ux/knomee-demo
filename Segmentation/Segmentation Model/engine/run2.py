# -*- coding: utf-8 -*-
import json, collections
import models2 as M, schema as S

profiles = json.load(open("profiles.json"))
plist = list(profiles.values())
cuts, basis = M.cohort_cuts(plist)
idf = M.purpose_idf(plist)
res = {"_meta": {"c_cuts": cuts, "c_basis": basis, "purpose_idf": idf}}
for k, p in profiles.items():
    res[k] = M.classify(p, cuts, idf)
json.dump(res, open("results2.json", "w"), indent=1)

print(f"Model C cuts ({basis}): vision {cuts['vision']}, readiness {cuts['readiness']}\n")
print(f"{'PROSPECT':<15} {'A · LIFE CHAPTER':<24} {'B · PURPOSE x POSTURE':<26} {'C · QUADRANT':<22} COV")
print("-"*105)
for k in profiles:
    r = res[k]
    a = r['A']['segment'] + (f" +{r['A']['secondary']}" if r['A']['secondary'] else "")
    print(f"{k:<15} {a:<24} {r['B']['segment']:<26} {r['C']['segment']:<22} {r['coverage']}%")
print()
for k in profiles:
    print(f"  {k:<15} D: {', '.join(t['tag'] for t in res[k]['D']['tags']) or '—'}")

print("\nDISTRIBUTIONS")
for m, f in (("A","segment"),("B","family"),("C","segment")):
    print(f"  {m}: {dict(collections.Counter(res[k][m][f] for k in profiles))}")
print(f"  D: {dict(collections.Counter(t['tag'] for k in profiles for t in res[k]['D']['tags']))}")

print("\nMODEL A — top domain scores per prospect (share-normalised)")
for k in profiles:
    top = list(res[k]['A']['all'].items())[:3]
    print(f"  {k:<15} " + "  ".join(f"{n} {v}" for n, v in top))
