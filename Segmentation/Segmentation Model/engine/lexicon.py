# -*- coding: utf-8 -*-
"""Resolution of 'Other' write-ins onto DECLARED options.

Policy (per product decision):
  - A write-in is approximated toward a declared option when the lexicon can
    place it. It can NEVER create a new category.
  - If it cannot be placed, or 'Other' was left blank, it does not count as an
    option at all - in every model, for every use case. It is dropped and
    logged, never guessed at.
  - The bare token 'Other' never counts anywhere.

Unresolved write-ins are the product output that matters: they are a ranked
backlog of options the Adventure is missing.
"""
import re
import schema as S

# term -> declared option. Terms are matched on whole words within a fragment.
IDEAL = {
 # Health & Activity
 "golf":"Sports","tennis":"Sports","pickleball":"Sports","skiing":"Sports","ski":"Sports",
 "snowboarding":"Sports","surfing":"Sports","cycling":"Sports","biking":"Sports","running":"Sports",
 "swimming":"Sports","rowing":"Sports","climbing":"Sports","martial arts":"Sports","soccer":"Sports",
 "basketball":"Sports","baseball":"Sports","football":"Sports","hockey":"Sports","racquetball":"Sports",
 "yoga":"Fitness","pilates":"Fitness","gym":"Fitness","weight training":"Fitness","exercise":"Fitness",
 "working out":"Fitness","crossfit":"Fitness","marathon":"Fitness",
 "hiking":"Outdoors","fishing":"Outdoors","hunting":"Outdoors","boating":"Outdoors","sailing":"Outdoors",
 "kayaking":"Outdoors","gardening":"Outdoors","nature":"Outdoors","trail":"Outdoors","skiing trips":"Outdoors",
 "wellness":"Health","longevity":"Health","fitness":"Health","staying healthy":"Health",
 "healthcare":"Health","health care":"Health","mental health":"Health",
 # Culture & Creativity
 "reading":"Creative pursuits","writing":"Creative pursuits","painting":"Creative pursuits",
 "photography":"Creative pursuits","pottery":"Creative pursuits","crafts":"Creative pursuits",
 "woodworking":"Creative pursuits","knitting":"Creative pursuits","drawing":"Creative pursuits",
 "sculpture":"Art","gallery":"Art","galleries":"Art","art classes":"Art",
 "opera":"Theater","ballet":"Theater","theatre":"Theater","plays":"Theater","broadway":"Theater",
 "live music":"Concerts","festivals":"Concerts","gigs":"Concerts","symphony":"Music",
 "playing music":"Music","guitar":"Music","piano":"Music","singing":"Music","choir":"Music",
 "dancing":"Music","dance":"Music",
 "restaurants":"Going out","dining":"Going out","dining out":"Going out","wine":"Going out",
 "wine tasting":"Going out","nightlife":"Going out","bars":"Going out","exhibitions":"Museums",
 # Travel & Exploration
 "europe":"International travel","asia":"International travel","cruise":"International travel",
 "cruises":"International travel","overseas travel":"International travel","safari":"International travel",
 "travel abroad":"International travel","international":"International travel",
 "road trip":"Domestic travel","road trips":"Domestic travel","roadtrip":"Domestic travel",
 "national parks":"Domestic travel","weekend trips":"Domestic travel",
 "glamping":"Camping","backpacking":"Camping","tent":"Camping",
 # Place & Setting
 "second home":"House","vacation home":"House","cabin":"House","cottage":"House","villa":"House",
 "renovation":"House","remodel":"House","downsizing":"House","homestead":"House",
 "condo":"Apartment","flat":"Apartment","pied a terre":"Apartment",
 "farm":"Country","ranch":"Country","acreage":"Country","rural":"Country","small town":"Country",
 "suburbs":"Suburb","downtown":"City","urban":"City","metropolis":"City",
 "seaside":"Beach","coast":"Beach","coastal":"Beach","shore":"Beach","island":"Ocean","sea":"Ocean",
 "sailing the ocean":"Ocean","waterfront":"Lake","lakeside":"Lake","lakefront":"Lake",
 "mountains":"Mountain","alps":"Mountain","ski town":"Mountain","cabin in the mountains":"Mountain",
 "expat":"Living abroad","move abroad":"Living abroad","live overseas":"Living abroad",
 "emigrate":"Living abroad","retire abroad":"Living abroad",
 "snowbirding":"Snowbird","winter in florida":"Snowbird","wintering south":"Snowbird",
 "rv":"RVing","motorhome":"RVing","caravan":"RVing","camper van":"RVing","van life":"RVing",
 "near kids":"Live near family","close to family":"Live near family","near grandkids":"Live near family",
 "desert southwest":"Desert",
 # Home & Table
 "hosting":"Entertaining","dinner parties":"Entertaining","hospitality":"Entertaining",
 "baking":"Cooking","cooking classes":"Cooking","food":"Cooking","barbecue":"Cooking",
 "dogs":"Pets","dog":"Pets","cats":"Pets","cat":"Pets","horses":"Pets","puppy":"Pets",
 "quiet time":"Staying home","home time":"Staying home","nesting":"Staying home",
 # People & Generations
 "grandkids":"Grandchildren","grandchildren":"Grandchildren","grandbabies":"Grandchildren",
 "family time":"Family","kids":"Family","children":"Family","spouse":"Family","marriage":"Family",
 "friendships":"Friends","community":"Friends","social life":"Friends",
 # Contribution
 "charity":"Philanthropic giving","charitable giving":"Philanthropic giving",
 "donations":"Philanthropic giving","foundation":"Philanthropic giving","tithing":"Philanthropic giving",
 "giving back":"Philanthropic giving","mentoring":"Volunteering","coaching":"Volunteering",
 "community service":"Volunteering","charity work":"Volunteering","board service":"Non-profit board work",
 "trustee":"Non-profit board work",
 # Work & Enterprise
 "consulting":"Gig work","freelance":"Gig work","part time work":"Gig work","side hustle":"Gig work",
 "contracting":"Gig work","advisory work":"Board room","board seats":"Board room",
 "corporate board":"Board room","directorship":"Board room",
}

WHERE = {
 "overseas":"Abroad","europe":"Abroad","abroad":"Abroad","another country":"Abroad",
 "small town":"In the country","rural":"In the country","farm":"In the country","countryside":"In the country",
 "seaside":"At the beach","coast":"At the beach","coastal":"At the beach","ocean":"At the beach",
 "downtown":"In a big city","urban":"In a big city","city centre":"In a big city","city center":"In a big city",
 "ski town":"In the mountains","mountains":"In the mountains","alps":"In the mountains",
 "suburbs":"In a suburb","suburbia":"In a suburb","southwest":"In the desert","arizona":"In the desert",
}

DOING = {
 "volunteering":"Helping others","mentoring":"Helping others","teaching":"Helping others",
 "coaching":"Helping others","charity work":"Helping others","giving back":"Helping others",
 "consulting":"Running a business","freelancing":"Running a business","entrepreneur":"Running a business",
 "starting a business":"Running a business","running a company":"Running a business",
 "writing":"Creative pursuits","painting":"Creative pursuits","making art":"Creative pursuits",
 "music":"Creative pursuits","photography":"Creative pursuits",
 "resting":"Relaxing","slowing down":"Relaxing","unwinding":"Relaxing","retired":"Relaxing",
 "entertaining":"Socializing","seeing friends":"Socializing","hosting":"Socializing",
 "exploring":"Traveling","seeing the world":"Traveling","adventuring":"Traveling",
}

WITH_ = {
 "spouse":"Romantic partner","wife":"Romantic partner","husband":"Romantic partner",
 "partner":"Romantic partner","my wife":"Romantic partner","my husband":"Romantic partner",
 "kids":"Family","children":"Family","grandkids":"Family","grandchildren":"Family",
 "my family":"Family","parents":"Family","siblings":"Family",
 "colleagues":"Business partner","co founder":"Business partner","cofounder":"Business partner",
 "business partners":"Business partner",
 "community":"A large group","congregation":"A large group","team":"A large group","club":"A large group",
 "alone":"Solo","by myself":"Solo","on my own":"Solo","myself":"Solo",
 "buddies":"Friends","close friends":"Friends","my friends":"Friends","mates":"Friends",
 "friend group":"Friends","old friends":"Friends",
}

PURPOSE = {
 "retirement":"Security","peace of mind":"Security","safety":"Security","stability":"Security",
 "a safety net":"Security","not worrying":"Security","healthcare":"Security","emergencies":"Security",
 "freedom":"Choice/Freedom","options":"Choice/Freedom","flexibility":"Choice/Freedom",
 "autonomy":"Independence","self sufficiency":"Independence","self reliance":"Independence",
 "not relying on anyone":"Independence",
 "less stress":"Simplicity","fewer decisions":"Simplicity","ease of mind":"Simplicity",
 "uncomplicated":"Simplicity",
 "travel":"Enjoying the moment","experiences":"Enjoying the moment","living now":"Enjoying the moment",
 "fun":"Enjoying the moment",
 "luxury":"Comfort","ease":"Comfort","quality of life":"Comfort","nice things":"Comfort",
 "recognition":"Status","prestige":"Status","success":"Status",
 "charity":"Philanthropy and giving","giving back":"Philanthropy and giving",
 "donating":"Philanthropy and giving","causes":"Philanthropy and giving",
 "my kids":"Supporting my family","education":"Supporting my family","my children":"Supporting my family",
 "caring for parents":"Supporting my family","legacy":"Supporting my family",
 "being in control":"Control","managing it myself":"Control","oversight":"Control",
}

LEXICONS = {"fy_ideal": IDEAL, "fy_where": WHERE, "fy_doing": DOING,
            "fy_with": WITH_, "money_purpose": PURPOSE}
UNIVERSES = {"fy_ideal": S.FY_IDEAL, "fy_where": S.FY_WHERE, "fy_doing": S.FY_DOING,
             "fy_with": S.FY_WITH, "money_purpose": S.MONEY_PURPOSE}

_SPLIT = re.compile(r"[,;/|]|\band\b|\balso\b|\bplus\b|&|\+")
_CLEAN = re.compile(r"[^a-z0-9 ]+")

def fragments(text):
    t = str(text).strip().lower()
    t = re.sub(r"^other\s*[:\-–]\s*", "", t)          # strip an "Other:" prefix
    return [_CLEAN.sub(" ", f).strip() for f in _SPLIT.split(t) if f.strip()]

def _match_fragment(frag, lex, universe):
    """All distinct concepts in one fragment.

    'a small town overseas' carries two - a setting and a location - and both
    are things the person said. Overlapping matches are collapsed so 'ski' and
    'skiing' do not both fire on the same span.
    """
    if not frag: return []
    for o in universe:                                 # already a declared option?
        if o.lower() == frag and o != "Other": return [(o, frag)]
    hits = []
    for term, opt in lex.items():
        for m in re.finditer(rf"\b{re.escape(term)}\b", frag):
            hits.append((m.start(), m.end(), opt, term))
    hits.sort(key=lambda h: -(h[1] - h[0]))             # longest term first
    kept, spans = [], []
    for a, b, opt, term in hits:
        if any(a < sb and b > sa for sa, sb in spans):  # overlaps a kept match
            continue
        spans.append((a, b)); kept.append((opt, term))
    return kept

def resolve(text, field):
    """Return (resolved declared options, audit trail, unresolved fragments)."""
    lex, uni = LEXICONS.get(field, {}), UNIVERSES.get(field, [])
    out, trail, dead = [], [], []
    for frag in fragments(text):
        kept = _match_fragment(frag, lex, uni)
        if kept:
            for opt, term in kept:
                if opt not in out: out.append(opt)
                trail.append({"wrote": frag, "matched": term, "resolved_to": opt})
        else:
            dead.append(frag)
    return out, trail, dead

# ---------------------------------------------------------------- horizon
_YEAR = re.compile(r"(\d+)\s*(?:\+|plus)?\s*(?:year|yr)")
def resolve_horizon(text):
    m = _YEAR.search(str(text).lower())
    if not m:
        t = str(text).lower()
        if any(w in t for w in ("next year", "soon", "asap", "months")): return "a few years", "near-term wording"
        return None, None
    y = int(m.group(1))
    b = ("a few years" if y < 5 else "5-10 years" if y < 10 else "10-15 years"
         if y < 15 else "15-20 years" if y < 20 else "over 20 years")
    return b, f"{y} years"

def validate():
    errs = []
    for f, lex in LEXICONS.items():
        uni = set(UNIVERSES[f])
        for term, opt in lex.items():
            if opt not in uni: errs.append(f"{f}: '{term}' -> '{opt}' is not a declared option")
            if opt == "Other":  errs.append(f"{f}: '{term}' resolves to 'Other'")
    return errs

if __name__ == "__main__":
    e = validate()
    print("LEXICON VALIDATION:", "PASS" if not e else "FAIL")
    for x in e: print("  ", x)
    for f, lex in LEXICONS.items():
        print(f"  {f:<15} {len(lex):>3} terms -> {len(set(lex.values()))} of "
              f"{len(UNIVERSES[f])-1} declared options")
