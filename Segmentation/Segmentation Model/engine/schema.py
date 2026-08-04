# -*- coding: utf-8 -*-
"""AUTHORITATIVE option space for the Knomee Adventure.

Transcribed from '2026 Knomee Content - Adventures.pdf'. This file is the
contract: every label in every model must be defined as an exhaustive
partition over the options declared here, so that ANY possible set of
answers resolves to a label.

Free text is never used to assign a label. It may only enrich a label.
"""

MONEY_PURPOSE = [           # p.2 - pick 1 to 3
 "Supporting my family","Status","Enjoying the moment","Comfort","Choice/Freedom",
 "Control","Independence","Philanthropy and giving","Simplicity","Security","Other"]

ATTENTION_AREAS = [         # p.3 - each gets + More / = Same / - Less
 "Work & Career","Financial Planning & Management","Health & Wellness",
 "Family & Relationships","Hobbies & Interests","Travel & Adventure","Home Life"]
ATTENTION_VALUES = ["+ More","= Same","- Less"]

CONFIDENCE_ITEMS = [        # p.5-7 - all 1..5
 "condition","resilience","goal_belief","joy_spend","regret_never","advisor_value"]
LIKERT = [1,2,3,4,5]

FY_WHERE = ["At the beach","In the mountains","In a big city","In a suburb",
            "In the country","In the desert","Abroad","Other"]
FY_DOING = ["Relaxing","Creative pursuits","Running a business","Traveling",
            "Helping others","Socializing","Other"]
FY_WITH  = ["Family","Friends","Solo","Romantic partner","Business partner",
            "A large group","Other"]
FY_HORIZON = ["a few years","5-10 years","10-15 years","15-20 years","over 20 years","Other"]

FY_IDEAL = [                # p.13 - 40 options + Other
 "Creative pursuits","International travel","Domestic travel","Theater","Concerts","Music",
 "Art","Museums","Going out","Staying home","Cooking","Entertaining","Fitness","Sports",
 "Outdoors","Family","Friends","Health","Camping","Gig work","Board room","Volunteering",
 "Philanthropic giving","Non-profit board work","Grandchildren","House","Apartment",
 "Live near family","City","Country","Suburb","Beach","Mountain","Living abroad","Snowbird",
 "RVing","Ocean","Lake","Desert","Pets","Other"]

GOAL_WHEN = ["< 12 months from now","1-5 years from now","6-10 years from now",
             "11-14 years from now","15+ years from now"]
GOAL_ADVISOR = ["I want to do it on my own.","I want help from my advisor."]
GOAL_THOUGHT = ["Not thinking/worried about it","I've thought about it, but no plans yet",
                "I am making changes to tackle it","I have made changes and am staying on track"]
GOAL_STEPS   = ["No idea","Some ideas, but unsure",
                "I know what to do and I've started making changes","I have already made changes"]
GOAL_ACTION  = ["Not yet.","Yes, I've taken steps.",
                "Yes, I am taking action and want to keep it up.","I've already made changes. It's done!"]

# ---------------------------------------------------------------------------
# LIFE DOMAIN PARTITION over FY_IDEAL.
# Every one of the 40 substantive options belongs to exactly one domain.
# 'Other' is deliberately excluded and handled as a residual.
# ---------------------------------------------------------------------------
IDEAL_DOMAINS = {
 "Place & Setting":      ["House","Apartment","City","Country","Suburb","Beach","Mountain",
                          "Ocean","Lake","Desert","Living abroad","Snowbird","RVing","Live near family"],
 "Travel & Exploration": ["International travel","Domestic travel","Camping"],
 "Culture & Creativity": ["Creative pursuits","Theater","Concerts","Music","Art","Museums","Going out"],
 "Home & Table":         ["Staying home","Cooking","Entertaining","Pets"],
 "Health & Activity":    ["Fitness","Sports","Outdoors","Health"],
 "People & Generations": ["Family","Friends","Grandchildren"],
 "Contribution":         ["Volunteering","Philanthropic giving","Non-profit board work"],
 "Work & Enterprise":    ["Gig work","Board room"],
}

# Attention areas reinforce domains. Financial Planning & Management is meta
# (it is about managing money, not about a life domain) and is used elsewhere.
ATTENTION_TO_DOMAIN = {
 "Work & Career":        ["Work & Enterprise"],
 "Health & Wellness":    ["Health & Activity"],
 "Family & Relationships":["People & Generations"],
 "Hobbies & Interests":  ["Culture & Creativity"],
 "Travel & Adventure":   ["Travel & Exploration"],
 "Home Life":            ["Home & Table","Place & Setting"],
}

# Future You 'doing' reinforces domains too.
DOING_TO_DOMAIN = {
 "Relaxing":["Home & Table"], "Creative pursuits":["Culture & Creativity"],
 "Running a business":["Work & Enterprise"], "Traveling":["Travel & Exploration"],
 "Helping others":["Contribution"], "Socializing":["People & Generations"],
}

# MONEY PURPOSE PARTITION - all 10 substantive options, exactly one family each.
PURPOSE_FAMILIES = {
 "Protector":   ["Security","Control","Supporting my family"],
 "Liberator":   ["Choice/Freedom","Independence","Simplicity"],
 "Experiencer": ["Enjoying the moment","Comfort"],
 "Contributor": ["Philanthropy and giving"],
 "Achiever":    ["Status"],
}

# ---------------------------------------------------------------------------
def validate():
    """Prove the partitions are total and disjoint. Run on import in tests."""
    errs = []
    seen = {}
    for dom, opts in IDEAL_DOMAINS.items():
        for o in opts:
            if o in seen: errs.append(f"FY_IDEAL '{o}' in both {seen[o]} and {dom}")
            seen[o] = dom
            if o not in FY_IDEAL: errs.append(f"FY_IDEAL '{o}' in {dom} is not a real option")
    missing = [o for o in FY_IDEAL if o != "Other" and o not in seen]
    if missing: errs.append(f"FY_IDEAL options in no domain: {missing}")

    seen = {}
    for fam, opts in PURPOSE_FAMILIES.items():
        for o in opts:
            if o in seen: errs.append(f"MONEY_PURPOSE '{o}' in both {seen[o]} and {fam}")
            seen[o] = fam
            if o not in MONEY_PURPOSE: errs.append(f"MONEY_PURPOSE '{o}' in {fam} is not a real option")
    missing = [o for o in MONEY_PURPOSE if o != "Other" and o not in seen]
    if missing: errs.append(f"MONEY_PURPOSE options in no family: {missing}")
    return errs

if __name__ == "__main__":
    e = validate()
    print("PARTITION VALIDATION:", "PASS - total and disjoint" if not e else "FAIL")
    for x in e: print("  ", x)
    print(f"  FY_IDEAL: {len(FY_IDEAL)-1} substantive options across {len(IDEAL_DOMAINS)} domains")
    for d, o in IDEAL_DOMAINS.items(): print(f"    {d:<24} {len(o):>2} options")
    print(f"  MONEY_PURPOSE: {len(MONEY_PURPOSE)-1} substantive options across {len(PURPOSE_FAMILIES)} families")
