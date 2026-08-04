# -*- coding: utf-8 -*-
"""Normalize Knomee Adventure sheets into a canonical prospect record."""
import json, re

AREAS = ["Work & Career","Financial Planning & Management","Health & Wellness",
         "Family & Relationships","Hobbies & Interests","Travel & Adventure","Home Life"]

CONF_KEYS = [
    ("condition",    "confident in my current financial condition"),
    ("resilience",   "weather unexpected financial challenges"),
    ("goal_belief",  "believe I can achieve my financial goals"),
    ("joy_spend",    "spend money on experiences"),
    ("regret_never", "regret or second-guess"),   # 5 = never regret
    ("advisor_value","working with a financial advisor improves my confidence"),
]

GOAL_KEYS = [
    ("goal_text",        "Identify a goal to focus on"),
    ("goal_when",        "When do you want to accomplish"),
    ("goal_why",         "Why do you want to achieve this"),
    ("goal_advisor_pref","Do you want support from"),
    ("goal_thought",     "Have you actively thought about"),
    ("goal_steps",       "Do you know what steps to take"),
    ("goal_action",      "Have you started to take action"),
    ("goal_worth",       "Why might this goal be worth it"),
    ("goal_challenge",   "What might make this goal challenging"),
    ("goal_stage_check", "is the correct stage for your goal"),
]

FY_KEYS = [
    ("fy_where",   "Where is Future You"),
    ("fy_doing",   "What is Future You doing"),
    ("fy_with",    "Who is Future You with"),
    ("fy_horizon", "How far in the future is your vision"),
    ("fy_ideal",   "ideal life include"),
    ("fy_postcard","postcard to yourself"),
    ("fy_vivid",   "How clear was the picture"),
]

STOP_MODULES = {"Advisor Only Fields","Lifestyle Aspirations","Values","Motivations",
                "Confidence and Concerns","Discussion Topic","Lifestyle Aspiration",
                "Value","Motivation","Confidence and Concern"}

def _last_num(cells):
    for c in reversed(cells):
        m = re.fullmatch(r"[1-5]", c.strip())
        if m: return int(c.strip())
    return None

def normalize(rows, key):
    p = {"key": key, "attention": {}, "concerns": [], "hopes": [],
         "money_purpose": [], "fy_where": [], "fy_doing": [], "fy_with": [], "fy_ideal": []}
    advisor_narrative = {"Lifestyle Aspiration": [], "Value": [], "Motivation": [],
                         "Confidence and Concern": [], "Discussion Topic": []}
    for r in rows:
        mod = r[0].strip()
        joined = " ".join(r)
        if mod in advisor_narrative:
            advisor_narrative[mod].append(" | ".join(r[1:]))
            continue
        if mod in STOP_MODULES:
            continue
        q = r[1] if len(r) > 1 else ""
        rest = [c for c in r[2:] if c != ""]

        if mod == "Sentiment":
            p["sentiment"] = _last_num(r[2:3]) or (int(r[2]) if len(r) > 2 and r[2].isdigit() else None)
            p["sentiment_label"] = r[3] if len(r) > 3 else None
        elif mod == "Financial Joy":
            if "help me with" in q:
                p["money_purpose"] = rest                      # order preserved = rank
            elif q in AREAS:
                v = rest[0] if rest else ""
                p["attention"][q] = 1 if "More" in v else (-1 if "Less" in v else 0)
            elif "brought you joy" in q:
                p["joy_experience"] = ", ".join(rest)
            elif "My financial joy" in q:
                p["joy_why"] = ", ".join(rest)
        elif mod == "Confidence":
            for k, frag in CONF_KEYS:
                if frag.lower() in joined.lower():
                    p.setdefault("conf", {})[k] = _last_num(r[1:])
                    break
        elif mod == "Questions":
            txt = ", ".join(rest)
            if "concern" in q.lower(): p["concerns"].append(txt)
            elif "hope" in q.lower():  p["hopes"].append(txt)
        elif mod == "Future You" or "postcard" in mod:
            src_q = q if mod == "Future You" else mod
            src_rest = rest if mod == "Future You" else [c for c in r[1:] if c != ""]
            for k, frag in FY_KEYS:
                if frag.lower() in src_q.lower():
                    if k in ("fy_horizon",):        p[k] = src_rest[0] if src_rest else None
                    elif k == "fy_vivid":           p[k] = _last_num(src_rest)
                    elif k == "fy_postcard":        p[k] = ", ".join(src_rest)
                    else:                           p[k] = src_rest
                    break
        elif mod == "Goals":
            for k, frag in GOAL_KEYS:
                if frag.lower() in q.lower():
                    p[k] = _last_num(rest) if k == "goal_stage_check" else ", ".join(rest)
                    break
    p["conf"] = p.get("conf", {})
    p["advisor_narrative"] = advisor_narrative
    p["concerns"] = [c for c in p["concerns"] if c.strip().lower() not in
                     ("no","no!","nope","none","all in last list","yes and no!")]
    p["hopes"] = [h for h in p["hopes"] if h.strip().lower() not in
                  ("no","nope","nothing","none","yes and no!")]
    return p

if __name__ == "__main__":
    raw = json.load(open("raw.json"))
    profiles = {k: normalize(v, k) for k, v in raw.items()}
    json.dump(profiles, open("profiles.json", "w"), indent=1)
    for k, p in profiles.items():
        print(k, "| purpose:", p["money_purpose"], "| conf:", p["conf"],
              "| vivid:", p.get("fy_vivid"), "| horizon:", p.get("fy_horizon"),
              "| ideal_n:", len(p.get("fy_ideal", [])), "| attn:", sum(p["attention"].values()))
