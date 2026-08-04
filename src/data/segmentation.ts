// AUTO-GENERATED from the Knomee segmentation engine (schema.py / models2.py).
// Regenerate rather than hand-edit: every label here is an exhaustive partition
// of the Adventure's closed option space, and the numbers are live scoring output.

export type TensionTag = { tag: string; why: string }

export type ScoredProspect = {
  key: string
  name: string
  coverage: number
  goal: string
  goalWhen: string
  purpose: string[]
  horizon: string
  vivid: number | null
  concerns: string[]
  hopes: string[]
  a: {
    segment: string
    secondary: string | null
    margin: number
    reasons: string[]
    all: Record<string, number>
  }
  b: { segment: string; family: string; posture: string; margin: number; reasons: string[] }
  c: {
    segment: string
    vision: number
    readiness: number
    visionReasons: string[]
    readinessReasons: string[]
  }
  d: TensionTag[]
}

export type SegmentDef = {
  name: string
  blurb: string
  hook: string
  action?: string
  options: string[]
}

export type ModelDef = {
  key: 'A' | 'B' | 'C' | 'D'
  name: string
  spine: string
  kind: 'exclusive' | 'grid' | 'multi'
  segments: SegmentDef[]
}

export type MethodStep = [string, string, string | null]

export type MethodDef = {
  title: string
  question: string
  inputs: string[][]
  steps: MethodStep[]
  rules?: string[][]
}

export const MODEL_KEYS = ['A', 'B', 'C', 'D'] as const
export type ModelKey = (typeof MODEL_KEYS)[number]

const raw = {
  "prospects": [
    {
      "key": "nicolehunter",
      "name": "Nicole Hunter",
      "coverage": 100,
      "goal": "give back to places and things I like the most",
      "goalWhen": "1-5 years from now",
      "purpose": [
        "Supporting my family",
        "Security",
        "Choice/Freedom"
      ],
      "horizon": "10-15 years",
      "vivid": 1,
      "concerns": [
        "kids financial  support"
      ],
      "hopes": [],
      "a": {
        "segment": "Culture & Creativity",
        "secondary": null,
        "margin": 0.129,
        "reasons": [
          "Ideal life: 5 of 7 'Culture & Creativity' options (Creative pursuits, Concerts, Music, Art...); expected 1.2 by chance -> lift 2.70",
          "Future You is 'Creative pursuits' (+0.07)"
        ],
        "all": {
          "Culture & Creativity": 0.614,
          "Health & Activity": 0.485,
          "People & Generations": 0.456,
          "Home & Table": 0.36,
          "Travel & Exploration": 0.206,
          "Contribution": 0.206,
          "Place & Setting": 0.183,
          "Work & Enterprise": 0.148
        }
      },
      "b": {
        "segment": "Uneasy Protector",
        "family": "Protector",
        "posture": "Uneasy",
        "margin": 2.28,
        "reasons": [
          "'Supporting my family' at rank 1, distinctiveness 0.18 (+0.55)",
          "'Security' at rank 2, distinctiveness 0.94 (+1.89)"
        ]
      },
      "c": {
        "segment": "Moving Without a Map",
        "vision": 36.0,
        "readiness": 36.0,
        "visionReasons": [
          "Vision clarity 1/5 (+0)",
          "7 of 40 ideal-life options selected (+8)",
          "Future You 'where': 2 selected (+5)",
          "Future You 'what': 4 selected (+8)",
          "Future You 'who': 3 selected (+7)",
          "Horizon set to '10-15 years' (+8)"
        ],
        "readinessReasons": [
          "goal_thought: 'I've thought about it, but no plans yet' = level 1/3 (+9)",
          "goal_steps: 'I know what to do and I've started making changes' = level 2/3 (+17)",
          "goal_action: 'Not yet.' = level 0/3 (+0)",
          "Timeframe '1-5 years from now' (+10)"
        ]
      },
      "d": [
        {
          "tag": "Deferred Joy",
          "why": "Wants MORE attention on Health & Wellness but scores 2/5 on spending for joy"
        },
        {
          "tag": "Vision Fog",
          "why": "Vision clarity 1/5 with only 7 ideal-life elements chosen"
        },
        {
          "tag": "Self-Directed",
          "why": "Chose to pursue this goal without advisor support"
        }
      ]
    },
    {
      "key": "jeffreyhunter",
      "name": "Jeffrey Hunter",
      "coverage": 100,
      "goal": "Fund kids education",
      "goalWhen": "1-5 years from now",
      "purpose": [
        "Choice/Freedom",
        "Enjoying the moment",
        "Comfort"
      ],
      "horizon": "5-10 years",
      "vivid": 3,
      "concerns": [
        "success at work",
        "will our kids be ok longterm"
      ],
      "hopes": [
        "I hope to be able to not worry about money for retirement to provide freedom and choice",
        "we'll be able to see the world"
      ],
      "a": {
        "segment": "Travel & Exploration",
        "secondary": null,
        "margin": 0.149,
        "reasons": [
          "Ideal life: 2 of 3 'Travel & Exploration' options (International travel, Domestic travel); expected 1.0 by chance -> lift 1.52",
          "Wants MORE attention on 'Travel & Adventure' (+0.25)",
          "Future You is 'Traveling' (+0.15)"
        ],
        "all": {
          "Travel & Exploration": 0.704,
          "People & Generations": 0.555,
          "Health & Activity": 0.511,
          "Culture & Creativity": 0.372,
          "Home & Table": 0.261,
          "Work & Enterprise": 0.242,
          "Place & Setting": 0.108,
          "Contribution": 0.101
        }
      },
      "b": {
        "segment": "Assured Experiencer",
        "family": "Experiencer",
        "posture": "Assured",
        "margin": 4.93,
        "reasons": [
          "'Enjoying the moment' at rank 2, distinctiveness 1.79 (+3.58)",
          "'Comfort' at rank 3, distinctiveness 1.79 (+1.79)"
        ]
      },
      "c": {
        "segment": "Moving Without a Map",
        "vision": 64.3,
        "readiness": 69.3,
        "visionReasons": [
          "Vision clarity 3/5 (+20)",
          "13 of 40 ideal-life options selected (+14)",
          "Future You 'where': 1 selected (+3)",
          "Future You 'what': 2 selected (+5)",
          "Future You 'who': 3 selected (+7)",
          "Horizon set to '5-10 years' (+8)",
          "Postcard completed (+7)"
        ],
        "readinessReasons": [
          "goal_thought: 'I have made changes and am staying on track' = level 3/3 (+26)",
          "goal_steps: 'I know what to do and I've started making changes' = level 2/3 (+17)",
          "goal_action: 'Yes, I've taken steps.' = level 1/3 (+10)",
          "Timeframe '1-5 years from now' (+10)",
          "Wants advisor help with this goal (+6)"
        ]
      },
      "d": [
        {
          "tag": "Decision Fatigue",
          "why": "Freedom-from-regret 2/5"
        },
        {
          "tag": "Planning Aversion",
          "why": "Wants LESS attention on financial planning while rating advisor value 5/5"
        },
        {
          "tag": "Advisor-Receptive",
          "why": "Advisor value 5/5 and asked for help"
        }
      ]
    },
    {
      "key": "ashleysmith",
      "name": "Ashley Smith",
      "coverage": 100,
      "goal": "House renovations",
      "goalWhen": "1-5 years from now",
      "purpose": [
        "Choice/Freedom",
        "Security",
        "Supporting my family"
      ],
      "horizon": "5-10 years",
      "vivid": 4,
      "concerns": [
        "How we can continue to balance spending and saving in a way that allows us to meet our goals and indulge in some wishes along the way"
      ],
      "hopes": [
        "That we have the team at Archer to help guide us and that we will be able to achieve all the goals we have set with some guidance and direction"
      ],
      "a": {
        "segment": "Travel & Exploration",
        "secondary": "People & Generations",
        "margin": 0.0,
        "reasons": [
          "Ideal life: 2 of 3 'Travel & Exploration' options (International travel, Domestic travel); expected 1.4 by chance -> lift 1.24",
          "Wants MORE attention on 'Travel & Adventure' (+0.25)",
          "Future You is 'Traveling' (+0.07)"
        ],
        "all": {
          "Travel & Exploration": 0.572,
          "People & Generations": 0.572,
          "Home & Table": 0.545,
          "Contribution": 0.322,
          "Place & Setting": 0.282,
          "Health & Activity": 0.276,
          "Work & Enterprise": 0.103,
          "Culture & Creativity": 0.092
        }
      },
      "b": {
        "segment": "Assured Protector",
        "family": "Protector",
        "posture": "Assured",
        "margin": 1.62,
        "reasons": [
          "'Security' at rank 2, distinctiveness 0.94 (+1.89)",
          "'Supporting my family' at rank 3, distinctiveness 0.18 (+0.18)"
        ]
      },
      "c": {
        "segment": "Ready to Build",
        "vision": 88.9,
        "readiness": 43.3,
        "visionReasons": [
          "Vision clarity 4/5 (+30)",
          "19 of 40 ideal-life options selected (+21)",
          "Future You 'where': 4 selected (+8)",
          "Future You 'what': 4 selected (+8)",
          "Future You 'who': 3 selected (+7)",
          "Horizon set to '5-10 years' (+8)",
          "Postcard completed (+7)"
        ],
        "readinessReasons": [
          "goal_thought: 'I've thought about it, but no plans yet' = level 1/3 (+9)",
          "goal_steps: 'Some ideas, but unsure' = level 1/3 (+9)",
          "goal_action: 'Yes, I've taken steps.' = level 1/3 (+10)",
          "Timeframe '1-5 years from now' (+10)",
          "Wants advisor help with this goal (+6)"
        ]
      },
      "d": [
        {
          "tag": "Advisor-Receptive",
          "why": "Advisor value 5/5 and asked for help"
        }
      ]
    },
    {
      "key": "davidsmith",
      "name": "David Smith",
      "coverage": 100,
      "goal": "A lake house",
      "goalWhen": "1-5 years from now",
      "purpose": [
        "Philanthropy and giving",
        "Choice/Freedom",
        "Supporting my family"
      ],
      "horizon": "10-15 years",
      "vivid": 5,
      "concerns": [
        "Nothing keeps me up at night, but I am still working to calibrate our monthly cash flow with Claire being retired and my income moving to quarterly true up.",
        "Balancing between saving for long term and spending to enhance our life."
      ],
      "hopes": [
        "A second house and more travel"
      ],
      "a": {
        "segment": "Culture & Creativity",
        "secondary": null,
        "margin": 0.098,
        "reasons": [
          "Ideal life: 7 of 7 'Culture & Creativity' options (Creative pursuits, Theater, Concerts, Music...); expected 4.0 by chance -> lift 1.59",
          "Wants MORE attention on 'Hobbies & Interests' (+0.25)",
          "Future You is 'Creative pursuits' (+0.06)"
        ],
        "all": {
          "Culture & Creativity": 0.628,
          "Travel & Exploration": 0.53,
          "People & Generations": 0.354,
          "Home & Table": 0.242,
          "Contribution": 0.207,
          "Health & Activity": 0.182,
          "Place & Setting": 0.155,
          "Work & Enterprise": 0.093
        }
      },
      "b": {
        "segment": "Assured Contributor",
        "family": "Contributor",
        "posture": "Assured",
        "margin": 5.08,
        "reasons": [
          "'Philanthropy and giving' at rank 1, distinctiveness 1.79 (+5.38)"
        ]
      },
      "c": {
        "segment": "Vivid but Stuck",
        "vision": 100.0,
        "readiness": 33.3,
        "visionReasons": [
          "Vision clarity 5/5 (+40)",
          "23 of 40 ideal-life options selected (+22)",
          "Future You 'where': 3 selected (+8)",
          "Future You 'what': 5 selected (+8)",
          "Future You 'who': 4 selected (+7)",
          "Horizon set to '10-15 years' (+8)",
          "Postcard completed (+7)"
        ],
        "readinessReasons": [
          "goal_thought: 'I've thought about it, but no plans yet' = level 1/3 (+9)",
          "goal_steps: 'Some ideas, but unsure' = level 1/3 (+9)",
          "goal_action: 'Not yet.' = level 0/3 (+0)",
          "Timeframe '1-5 years from now' (+10)",
          "Wants advisor help with this goal (+6)"
        ]
      },
      "d": [
        {
          "tag": "Deferred Joy",
          "why": "Wants MORE attention on Travel & Adventure, Hobbies & Interests but scores 3/5 on spending for joy"
        },
        {
          "tag": "Vision-Action Gap",
          "why": "Vision clarity 5/5 but action = 'Not yet.'"
        },
        {
          "tag": "Permission Gap",
          "why": "Condition 5/5 and resilience 5/5 but joy-spending 3/5"
        },
        {
          "tag": "Horizon Mismatch",
          "why": "Goal set '1-5 years from now' but steps = 'Some ideas, but unsure' and no action taken"
        },
        {
          "tag": "Advisor-Receptive",
          "why": "Advisor value 5/5 and asked for help"
        }
      ]
    },
    {
      "key": "kiralopez",
      "name": "Kira Lopez",
      "coverage": 100,
      "goal": "establish an annual summer sabbatical of one month plus",
      "goalWhen": "1-5 years from now",
      "purpose": [
        "Supporting my family",
        "Choice/Freedom",
        "Simplicity"
      ],
      "horizon": "5-10 years",
      "vivid": 4,
      "concerns": [
        "- cash flow in the short term"
      ],
      "hopes": [
        "feeling more comfortable in our cash flow so that we can prioritize things like date nights, travel (with or without the girls), our individual wellness",
        "if money weren't a factor, I would spend time getting our home/ kids/ things organized, streamlined, and supported (for example, someone else to do the grocery shopping or meal prep) so those things weren't such a burden or time suck."
      ],
      "a": {
        "segment": "Travel & Exploration",
        "secondary": null,
        "margin": 0.125,
        "reasons": [
          "Ideal life: 3 of 3 'Travel & Exploration' options (International travel, Domestic travel, Camping); expected 1.8 by chance -> lift 1.43",
          "Wants MORE attention on 'Travel & Adventure' (+0.25)",
          "Future You is 'Traveling' (+0.07)"
        ],
        "all": {
          "Travel & Exploration": 0.611,
          "Health & Activity": 0.485,
          "Culture & Creativity": 0.481,
          "People & Generations": 0.464,
          "Work & Enterprise": 0.416,
          "Home & Table": 0.31,
          "Contribution": 0.289,
          "Place & Setting": 0.149
        }
      },
      "b": {
        "segment": "Working on it Liberator",
        "family": "Liberator",
        "posture": "Working on it",
        "margin": 1.55,
        "reasons": [
          "'Choice/Freedom' at rank 2, distinctiveness 0.15 (+0.30)",
          "'Simplicity' at rank 3, distinctiveness 1.79 (+1.79)"
        ]
      },
      "c": {
        "segment": "Vivid but Stuck",
        "vision": 90.0,
        "readiness": 16.0,
        "visionReasons": [
          "Vision clarity 4/5 (+30)",
          "24 of 40 ideal-life options selected (+22)",
          "Future You 'where': 4 selected (+8)",
          "Future You 'what': 4 selected (+8)",
          "Future You 'who': 3 selected (+7)",
          "Horizon set to '5-10 years' (+8)",
          "Postcard completed (+7)"
        ],
        "readinessReasons": [
          "goal_thought: 'Not thinking/worried about it' = level 0/3 (+0)",
          "goal_steps: 'No idea' = level 0/3 (+0)",
          "goal_action: 'Not yet.' = level 0/3 (+0)",
          "Timeframe '1-5 years from now' (+10)",
          "Wants advisor help with this goal (+6)"
        ]
      },
      "d": [
        {
          "tag": "Deferred Joy",
          "why": "Wants MORE attention on Travel & Adventure, Hobbies & Interests, Health & Wellness but scores 3/5 on spending for joy"
        },
        {
          "tag": "Confidence Gap",
          "why": "Goal belief 5/5 but condition 2/5, resilience 2/5"
        },
        {
          "tag": "Vision-Action Gap",
          "why": "Vision clarity 4/5 but action = 'Not yet.'"
        },
        {
          "tag": "Horizon Mismatch",
          "why": "Goal set '1-5 years from now' but steps = 'No idea' and no action taken"
        },
        {
          "tag": "Advisor-Receptive",
          "why": "Advisor value 5/5 and asked for help"
        }
      ]
    },
    {
      "key": "lukelopez",
      "name": "Luke Lopez",
      "coverage": 100,
      "goal": "Get cash flow back positive and feeling confident that we're on the right track financiallyy",
      "goalWhen": "< 12 months from now",
      "purpose": [
        "Choice/Freedom",
        "Independence",
        "Supporting my family"
      ],
      "horizon": "5-10 years",
      "vivid": 5,
      "concerns": [
        "Month-to-month cash flow is negative",
        "Financially taking care of my mother years earlier than expected"
      ],
      "hopes": [
        "Getting back to a positive monthly cash flow that allows us to get back on track",
        "Getting work/my company back on track in 1h 2026"
      ],
      "a": {
        "segment": "Culture & Creativity",
        "secondary": "Travel & Exploration",
        "margin": 0.011,
        "reasons": [
          "Ideal life: 7 of 7 'Culture & Creativity' options (Creative pursuits, Theater, Concerts, Music...); expected 5.1 by chance -> lift 1.32",
          "Wants MORE attention on 'Hobbies & Interests' (+0.25)",
          "Future You is 'Creative pursuits' (+0.06)"
        ],
        "all": {
          "Culture & Creativity": 0.573,
          "Travel & Exploration": 0.562,
          "Health & Activity": 0.506,
          "People & Generations": 0.499,
          "Work & Enterprise": 0.473,
          "Home & Table": 0.265,
          "Place & Setting": 0.161,
          "Contribution": 0.126
        }
      },
      "b": {
        "segment": "Working on it Liberator",
        "family": "Liberator",
        "posture": "Working on it",
        "margin": 2.83,
        "reasons": [
          "'Choice/Freedom' at rank 1, distinctiveness 0.15 (+0.45)",
          "'Independence' at rank 2, distinctiveness 1.28 (+2.56)"
        ]
      },
      "c": {
        "segment": "Vivid but Stuck",
        "vision": 100.0,
        "readiness": 35.3,
        "visionReasons": [
          "Vision clarity 5/5 (+40)",
          "29 of 40 ideal-life options selected (+22)",
          "Future You 'where': 3 selected (+8)",
          "Future You 'what': 5 selected (+8)",
          "Future You 'who': 3 selected (+7)",
          "Horizon set to '5-10 years' (+8)",
          "Postcard completed (+7)"
        ],
        "readinessReasons": [
          "goal_thought: 'I've thought about it, but no plans yet' = level 1/3 (+9)",
          "goal_steps: 'Some ideas, but unsure' = level 1/3 (+9)",
          "goal_action: 'Not yet.' = level 0/3 (+0)",
          "Timeframe '< 12 months from now' (+12)",
          "Wants advisor help with this goal (+6)"
        ]
      },
      "d": [
        {
          "tag": "Vision-Action Gap",
          "why": "Vision clarity 5/5 but action = 'Not yet.'"
        },
        {
          "tag": "Horizon Mismatch",
          "why": "Goal set '< 12 months from now' but steps = 'Some ideas, but unsure' and no action taken"
        },
        {
          "tag": "Advisor-Receptive",
          "why": "Advisor value 5/5 and asked for help"
        }
      ]
    },
    {
      "key": "mattbravos",
      "name": "Matt Bravos",
      "coverage": 100,
      "goal": "Find a way to make work optional and be able to travel while the kids are still at home.",
      "goalWhen": "1-5 years from now",
      "purpose": [
        "Supporting my family",
        "Choice/Freedom",
        "Independence"
      ],
      "horizon": "5-10 years",
      "vivid": 2,
      "concerns": [
        "Making sure that my family will have resources to handle a major setback or medical emergency"
      ],
      "hopes": [
        "I would stop working at my current career.",
        "Id like to develop a piece of land that we currently own. Id like to take our kids on some adventures and trips."
      ],
      "a": {
        "segment": "Health & Activity",
        "secondary": null,
        "margin": 0.082,
        "reasons": [
          "Ideal life: 4 of 4 'Health & Activity' options (Fitness, Sports, Outdoors, Health); expected 1.0 by chance -> lift 2.50",
          "Wants MORE attention on 'Health & Wellness' (+0.25)"
        ],
        "all": {
          "Health & Activity": 0.75,
          "Travel & Exploration": 0.668,
          "People & Generations": 0.668,
          "Culture & Creativity": 0.323,
          "Contribution": 0.189,
          "Home & Table": 0.175,
          "Place & Setting": 0.133,
          "Work & Enterprise": 0.133
        }
      },
      "b": {
        "segment": "Assured Liberator",
        "family": "Liberator",
        "posture": "Assured",
        "margin": 1.03,
        "reasons": [
          "'Choice/Freedom' at rank 2, distinctiveness 0.15 (+0.30)",
          "'Independence' at rank 3, distinctiveness 1.28 (+1.28)"
        ]
      },
      "c": {
        "segment": "Moving Without a Map",
        "vision": 56.3,
        "readiness": 43.3,
        "visionReasons": [
          "Vision clarity 2/5 (+10)",
          "10 of 40 ideal-life options selected (+11)",
          "Future You 'where': 2 selected (+5)",
          "Future You 'what': 4 selected (+8)",
          "Future You 'who': 3 selected (+7)",
          "Horizon set to '5-10 years' (+8)",
          "Postcard completed (+7)"
        ],
        "readinessReasons": [
          "goal_thought: 'I've thought about it, but no plans yet' = level 1/3 (+9)",
          "goal_steps: 'Some ideas, but unsure' = level 1/3 (+9)",
          "goal_action: 'Yes, I've taken steps.' = level 1/3 (+10)",
          "Timeframe '1-5 years from now' (+10)",
          "Wants advisor help with this goal (+6)"
        ]
      },
      "d": [
        {
          "tag": "Advisor-Receptive",
          "why": "Advisor value 5/5 and asked for help"
        }
      ]
    },
    {
      "key": "kristenbravos",
      "name": "Kristen Bravos",
      "coverage": 100,
      "goal": "Own a home in Lake Tahoe, Montana, or Utah. Travel to Europe with my family within 2 years.",
      "goalWhen": "1-5 years from now",
      "purpose": [
        "Supporting my family",
        "Choice/Freedom",
        "Security"
      ],
      "horizon": "a few years",
      "vivid": 3,
      "concerns": [
        "That I didn't responsibly handle the money we currently have.",
        "That I may not use the money we have grown to it's full potential."
      ],
      "hopes": [
        "The potential to grow our money to a level that our children will have a set future. That we can enjoy the benefits together.",
        "I would like to help my mom with some expenses."
      ],
      "a": {
        "segment": "Travel & Exploration",
        "secondary": null,
        "margin": 0.093,
        "reasons": [
          "Ideal life: 3 of 3 'Travel & Exploration' options (International travel, Domestic travel, Camping); expected 1.9 by chance -> lift 1.39",
          "Wants MORE attention on 'Travel & Adventure' (+0.25)",
          "Future You is 'Traveling' (+0.10)"
        ],
        "all": {
          "Travel & Exploration": 0.628,
          "Health & Activity": 0.536,
          "Home & Table": 0.454,
          "Place & Setting": 0.31,
          "Culture & Creativity": 0.286,
          "People & Generations": 0.209,
          "Contribution": 0.139,
          "Work & Enterprise": 0.089
        }
      },
      "b": {
        "segment": "Assured Protector",
        "family": "Protector",
        "posture": "Assured",
        "margin": 1.19,
        "reasons": [
          "'Supporting my family' at rank 1, distinctiveness 0.18 (+0.55)",
          "'Security' at rank 3, distinctiveness 0.94 (+0.94)"
        ]
      },
      "c": {
        "segment": "Not Yet Looking",
        "vision": 75.3,
        "readiness": 33.3,
        "visionReasons": [
          "Vision clarity 3/5 (+20)",
          "25 of 40 ideal-life options selected (+22)",
          "Future You 'where': 4 selected (+8)",
          "Future You 'what': 3 selected (+8)",
          "Future You 'who': 1 selected (+2)",
          "Horizon set to 'a few years' (+8)",
          "Postcard completed (+7)"
        ],
        "readinessReasons": [
          "goal_thought: 'I've thought about it, but no plans yet' = level 1/3 (+9)",
          "goal_steps: 'Some ideas, but unsure' = level 1/3 (+9)",
          "goal_action: 'Not yet.' = level 0/3 (+0)",
          "Timeframe '1-5 years from now' (+10)",
          "Wants advisor help with this goal (+6)"
        ]
      },
      "d": [
        {
          "tag": "Horizon Mismatch",
          "why": "Goal set '1-5 years from now' but steps = 'Some ideas, but unsure' and no action taken"
        },
        {
          "tag": "Advisor-Receptive",
          "why": "Advisor value 5/5 and asked for help"
        }
      ]
    }
  ],
  "models": {
    "A": {
      "key": "A",
      "name": "Life Domain",
      "spine": "Which life domain the future vision points at — the 8-domain partition of the 40 ideal-life options",
      "kind": "exclusive",
      "segments": [
        {
          "name": "Place & Setting",
          "blurb": "The future vision is anchored to a place - a home, a region, a setting.",
          "hook": "The address is the goal. Let's make the numbers meet it.",
          "options": [
            "House",
            "Apartment",
            "City",
            "Country",
            "Suburb",
            "Beach",
            "Mountain",
            "Ocean",
            "Lake",
            "Desert",
            "Living abroad",
            "Snowbird",
            "RVing",
            "Live near family"
          ]
        },
        {
          "name": "Travel & Exploration",
          "blurb": "The vision is about going further - travel, exploration, new ground.",
          "hook": "The window for this is open now. Let's use it.",
          "options": [
            "International travel",
            "Domestic travel",
            "Camping"
          ]
        },
        {
          "name": "Culture & Creativity",
          "blurb": "Culture, creativity and expression carry the vision - art, music, making things.",
          "hook": "Fund the part of life that isn't on the balance sheet.",
          "options": [
            "Creative pursuits",
            "Theater",
            "Concerts",
            "Music",
            "Art",
            "Museums",
            "Going out"
          ]
        },
        {
          "name": "Home & Table",
          "blurb": "Home as the centre of gravity - cooking, hosting, being in it rather than away from it.",
          "hook": "Make home the best place you spend money.",
          "options": [
            "Staying home",
            "Cooking",
            "Entertaining",
            "Pets"
          ]
        },
        {
          "name": "Health & Activity",
          "blurb": "Health, fitness and being physically able to enjoy what comes next.",
          "hook": "The plan only works if you're well enough to live it.",
          "options": [
            "Fitness",
            "Sports",
            "Outdoors",
            "Health"
          ]
        },
        {
          "name": "People & Generations",
          "blurb": "Relationships are the vision - family, friends, generations.",
          "hook": "Plan around the people, not the portfolio.",
          "options": [
            "Family",
            "Friends",
            "Grandchildren"
          ]
        },
        {
          "name": "Contribution",
          "blurb": "Contribution beyond the household - volunteering, philanthropy, board work.",
          "hook": "Turn generosity into a plan with real impact.",
          "options": [
            "Volunteering",
            "Philanthropic giving",
            "Non-profit board work"
          ]
        },
        {
          "name": "Work & Enterprise",
          "blurb": "Work and enterprise remain central to the future, not something to escape.",
          "hook": "You're not winding down. Let's plan for what you're still building.",
          "options": [
            "Gig work",
            "Board room"
          ]
        },
        {
          "name": "Insufficient Signal",
          "blurb": "Too few closed answers to place a chapter. Not a segment - a data gap.",
          "hook": "(no campaign - route back to complete the Adventure)",
          "options": []
        }
      ]
    },
    "B": {
      "key": "B",
      "name": "Purpose × Posture",
      "spine": "Why money matters, crossed with how they feel about it",
      "kind": "exclusive",
      "segments": [
        {
          "name": "Protector",
          "blurb": "Money is a shield for the people they love.",
          "hook": "Protect what you've built - and who's counting on it.",
          "options": [
            "Security",
            "Control",
            "Supporting my family"
          ]
        },
        {
          "name": "Liberator",
          "blurb": "Money is optionality - a wider range of choices.",
          "hook": "More options. Fewer obligations.",
          "options": [
            "Choice/Freedom",
            "Independence",
            "Simplicity"
          ]
        },
        {
          "name": "Experiencer",
          "blurb": "Money is fuel for living now.",
          "hook": "Don't save the good life for later.",
          "options": [
            "Enjoying the moment",
            "Comfort"
          ]
        },
        {
          "name": "Contributor",
          "blurb": "Money is leverage for impact beyond the household.",
          "hook": "Make your generosity go further.",
          "options": [
            "Philanthropy and giving"
          ]
        },
        {
          "name": "Achiever",
          "blurb": "Money marks and validates progress.",
          "hook": "You've earned the position. Let's make it durable.",
          "options": [
            "Status"
          ]
        },
        {
          "name": "Unstated",
          "blurb": "Chose 'Other' or skipped. Purpose not captured by the option set.",
          "hook": "(no campaign - candidate for an added option)",
          "options": [
            "(Other or no answer)"
          ]
        }
      ]
    },
    "C": {
      "key": "C",
      "name": "Vision × Readiness",
      "spine": "How clearly they see the destination, crossed with how close they are to acting",
      "kind": "grid",
      "segments": [
        {
          "name": "Ready to Build",
          "blurb": "Clear picture, already moving. Shortest path to a signed client.",
          "hook": "You know where you're going. Let's build the plan that gets you there.",
          "action": "Highest-priority outreach. Lead with capability and speed.",
          "options": []
        },
        {
          "name": "Vivid but Stuck",
          "blurb": "Detailed future, no first step taken. Blocked by how, not whether.",
          "hook": "You can already see it. Here's the first move.",
          "action": "Best nurture audience. Lead with a concrete first step.",
          "options": []
        },
        {
          "name": "Moving Without a Map",
          "blurb": "Acting, but the destination is fuzzy. Risk of optimising toward the wrong thing.",
          "hook": "You're doing the work. Let's point it at the right life.",
          "action": "Strong advisor fit. Lead with direction-setting.",
          "options": []
        },
        {
          "name": "Not Yet Looking",
          "blurb": "Neither vision nor plan formed. Genuine top-of-funnel.",
          "hook": "Start with what you actually want.",
          "action": "Long nurture. Lead with the Adventure itself.",
          "options": []
        }
      ]
    },
    "D": {
      "key": "D",
      "name": "Tension Tags",
      "spine": "Where what they want contradicts what they believe or do",
      "kind": "multi",
      "segments": [
        {
          "name": "Deferred Joy",
          "blurb": "Wants more of what brings joy but won't spend on it.",
          "hook": "The things you love shouldn't be the first thing cut.",
          "options": []
        },
        {
          "name": "Confidence Gap",
          "blurb": "Believes in the goal but doubts the current footing.",
          "hook": "You believe you'll get there. Let's make today's numbers agree.",
          "options": []
        },
        {
          "name": "Vision-Action Gap",
          "blurb": "Vivid future, no first step taken. Largest conversion opportunity.",
          "hook": "You've done the hard part - imagining it. Here's step one.",
          "options": []
        },
        {
          "name": "Permission Gap",
          "blurb": "Secure but still won't spend on joy. Needs permission, not capacity.",
          "hook": "You can afford this. Here's the proof.",
          "options": []
        },
        {
          "name": "Decision Fatigue",
          "blurb": "Second-guesses decisions regardless of outcome.",
          "hook": "Stop re-litigating every decision.",
          "options": []
        },
        {
          "name": "Horizon Mismatch",
          "blurb": "Near-term goal date with no plan behind it.",
          "hook": "Your timeline is closer than your plan.",
          "options": []
        },
        {
          "name": "Planning Aversion",
          "blurb": "Wants less time on financial admin but rates advisors highly. Delegation-ready.",
          "hook": "Hand it over. That's what we're for.",
          "options": []
        },
        {
          "name": "Vision Fog",
          "blurb": "Cannot picture the future yet - low clarity and few elements chosen.",
          "hook": "Before the plan, the picture.",
          "options": []
        },
        {
          "name": "Solo Future",
          "blurb": "Future You is alone. Different planning needs from a household plan.",
          "hook": "A plan built around you, not a household.",
          "options": []
        },
        {
          "name": "Advisor-Receptive",
          "blurb": "Rates advisors highly and asked for help.",
          "hook": "Ready for a partner.",
          "options": []
        },
        {
          "name": "Self-Directed",
          "blurb": "Prefers to go it alone. Advisory framing will meet resistance.",
          "hook": "Lead with tools and insight, not a service pitch.",
          "options": []
        }
      ]
    }
  },
  "method": {
    "A": {
      "title": "Model A — Life Domain",
      "question": "Which life domain does this person's future vision point at?",
      "inputs": [
        [
          "Ideal life includes",
          "40 options, partitioned into 8 domains",
          "60% of the score"
        ],
        [
          "Attention shifts",
          "7 areas, + More / = Same / − Less",
          "25% of the score"
        ],
        [
          "Future You is doing",
          "6 options mapped to domains",
          "15% of the score"
        ]
      ],
      "steps": [
        [
          "1 · Count the hits per domain",
          "Each of the 40 ideal-life options belongs to exactly one domain. Count how many the person selected in each.",
          null
        ],
        [
          "2 · Work out what chance would predict",
          "A domain with 14 options will collect more picks than one with 2, purely on size. So compute how many hits you'd expect if their picks were spread at random.",
          "expected = (their total picks) × (options in domain) ÷ 40"
        ],
        [
          "3 · Score the over-representation, not the raw count",
          "Lift asks whether the domain is over-represented among THIS person's picks. The +1 on both sides shrinks small domains toward 1.0, so a single lucky pick in a 2-option domain can't dominate.",
          "lift = (hits + 1) ÷ (expected + 1)"
        ],
        [
          "4 · Add the reinforcing signals",
          "Attention shifts marked '+ More' and Future You 'doing' selections both map to domains and add their weighted share.",
          "score = 0.60 × (lift ÷ 3) + 0.25 × attention share + 0.15 × doing share"
        ],
        [
          "5 · Highest score wins; near-ties report both",
          "If the runner-up is within 0.08, both domains are reported. Two domains can genuinely be co-live. If none of the three inputs was answered, the result is 'Insufficient Signal' — never a silent default.",
          null
        ]
      ],
      "example": {
        "who": "davidsmith",
        "picks": 23,
        "total": 40,
        "rows": [
          {
            "domain": "Culture & Creativity",
            "size": 7,
            "hits": 7,
            "expected": 4.03,
            "lift": 1.59,
            "contrib": 0.318,
            "picked": "Creative pursuits, Theater, Concerts, Music, Art, Museums, Going out"
          },
          {
            "domain": "People & Generations",
            "size": 3,
            "hits": 3,
            "expected": 1.73,
            "lift": 1.47,
            "contrib": 0.294,
            "picked": "Family, Friends, Grandchildren"
          },
          {
            "domain": "Travel & Exploration",
            "size": 3,
            "hits": 2,
            "expected": 1.73,
            "lift": 1.1,
            "contrib": 0.22,
            "picked": "International travel, Domestic travel"
          },
          {
            "domain": "Home & Table",
            "size": 4,
            "hits": 2,
            "expected": 2.3,
            "lift": 0.91,
            "contrib": 0.182,
            "picked": "Staying home, Pets"
          },
          {
            "domain": "Health & Activity",
            "size": 4,
            "hits": 2,
            "expected": 2.3,
            "lift": 0.91,
            "contrib": 0.182,
            "picked": "Outdoors, Health"
          },
          {
            "domain": "Place & Setting",
            "size": 14,
            "hits": 6,
            "expected": 8.05,
            "lift": 0.77,
            "contrib": 0.155,
            "picked": "House, Country, Mountain, Ocean, Lake, Live near family"
          },
          {
            "domain": "Contribution",
            "size": 3,
            "hits": 1,
            "expected": 1.73,
            "lift": 0.73,
            "contrib": 0.147,
            "picked": "Philanthropic giving"
          },
          {
            "domain": "Work & Enterprise",
            "size": 2,
            "hits": 0,
            "expected": 1.15,
            "lift": 0.47,
            "contrib": 0.093,
            "picked": ""
          }
        ],
        "attention_more": [
          "Hobbies & Interests",
          "Travel & Adventure"
        ],
        "doing": [
          "Relaxing",
          "Creative pursuits",
          "Traveling",
          "Helping others",
          "Socializing"
        ],
        "final": {
          "Culture & Creativity": 0.628,
          "Travel & Exploration": 0.53,
          "People & Generations": 0.354,
          "Home & Table": 0.242,
          "Contribution": 0.207,
          "Health & Activity": 0.182,
          "Place & Setting": 0.155,
          "Work & Enterprise": 0.093
        },
        "segment": "Culture & Creativity"
      }
    },
    "B": {
      "title": "Model B — Purpose × Posture",
      "question": "Why does money matter to them, and how do they feel about it?",
      "inputs": [
        [
          "I want money to help me with",
          "10 options + Other, ranked 1–3",
          "Family axis"
        ],
        [
          "Confidence items",
          "condition, resilience, goal belief, freedom from regret",
          "Posture axis"
        ]
      ],
      "steps": [
        [
          "1 · Map each pick to a family",
          "All 10 options partition into 5 families. 'Other' or no answer resolves to 'Unstated'.",
          null
        ],
        [
          "2 · Weight by position, then by distinctiveness",
          "First pick scores 3, second 2, third 1. Then multiply by an inverse-frequency weight: an option almost everyone picks tells you little about who this person is.",
          "weight = ln((n + 1) ÷ (times picked + 0.5))"
        ],
        [
          "3 · Highest family wins",
          "Margins under 2 points are flagged rather than hidden.",
          null
        ],
        [
          "4 · Posture from the confidence block",
          "Mean of four items, banded. No confidence answers at all resolves to 'Unrated'.",
          "Assured ≥ 4.2 · Working on it ≥ 3.2 · Uneasy < 3.2"
        ]
      ],
      "example": {
        "who": "davidsmith",
        "rows": [
          {
            "opt": "Philanthropy and giving",
            "pos": 1,
            "rank": 3,
            "family": "Contributor",
            "weight": 1.79,
            "points": 5.38
          },
          {
            "opt": "Choice/Freedom",
            "pos": 2,
            "rank": 2,
            "family": "Liberator",
            "weight": 0.15,
            "points": 0.3
          },
          {
            "opt": "Supporting my family",
            "pos": 3,
            "rank": 1,
            "family": "Protector",
            "weight": 0.18,
            "points": 0.18
          }
        ],
        "all": {
          "Contributor": 5.38,
          "Liberator": 0.3,
          "Protector": 0.18,
          "Experiencer": 0.0,
          "Achiever": 0.0,
          "Unstated": 0.0
        },
        "posture": "Assured",
        "mean": 4.75,
        "segment": "Assured Contributor"
      }
    },
    "C": {
      "title": "Model C — Vision × Readiness",
      "question": "How clearly can they see the destination, and how close are they to acting?",
      "inputs": [
        [
          "Vision clarity 1–5, ideal-life count, where/doing/who counts, horizon set, postcard completed",
          "all closed",
          "Vision axis, 0–100"
        ],
        [
          "Readiness: thought / steps / action, goal timeframe, advisor preference",
          "all closed enums",
          "Readiness axis, 0–100"
        ]
      ],
      "steps": [
        [
          "1 · Build the Vision score",
          "Clarity rating contributes up to 40, breadth of ideal-life selections up to 22, the where/what/who answers up to 23, horizon 8, postcard completion 7. The postcard's CONTENT is never read — only whether it was filled in.",
          null
        ],
        [
          "2 · Build the Readiness score",
          "The three transtheoretical questions are ordered 4-point scales; position on each maps linearly. Thought 26, steps 26, action 30, timeframe up to 12, advisor preference 6.",
          "points = (position on the scale ÷ 3) × weight"
        ],
        [
          "3 · Split at the cohort median, not a fixed number",
          "The Adventure is designed to elicit a vivid vision, so absolute vision scores skew high — the median here is 82.1. A fixed threshold would file almost everyone under 'vivid' and the axis would carry no information. Books under 6 profiles fall back to absolute cuts.",
          "current cuts — vision 82.1 · readiness 35.7 (cohort median)"
        ],
        [
          "4 · Quadrant by construction",
          "Above both cuts → Ready to Build. Vision only → Vivid but Stuck. Readiness only → Moving Without a Map. Neither → Not Yet Looking. Exhaustive by definition, so nobody is ever unlabeled.",
          null
        ]
      ],
      "example": {
        "who": "kiralopez",
        "vision": 90.0,
        "readiness": 16.0,
        "vision_reasons": [
          "Vision clarity 4/5 (+30)",
          "24 of 40 ideal-life options selected (+22)",
          "Future You 'where': 4 selected (+8)",
          "Future You 'what': 4 selected (+8)",
          "Future You 'who': 3 selected (+7)",
          "Horizon set to '5-10 years' (+8)",
          "Postcard completed (+7)"
        ],
        "readiness_reasons": [
          "goal_thought: 'Not thinking/worried about it' = level 0/3 (+0)",
          "goal_steps: 'No idea' = level 0/3 (+0)",
          "goal_action: 'Not yet.' = level 0/3 (+0)",
          "Timeframe '1-5 years from now' (+10)",
          "Wants advisor help with this goal (+6)"
        ],
        "cuts": {
          "vision": 82.1,
          "readiness": 35.7
        },
        "basis": "cohort median",
        "segment": "Vivid but Stuck"
      }
    },
    "D": {
      "title": "Model D — Tension Tags",
      "question": "Where does what they want contradict what they believe or do?",
      "inputs": [
        [
          "Confidence items, vision clarity, readiness enums, attention shifts, advisor preference, Future You 'who'",
          "all closed",
          "Multi-label"
        ]
      ],
      "steps": [
        [
          "1 · Each tag is a single explicit rule over closed answers",
          "No scoring, no thresholds to tune, no free text. A tag either fires or it doesn't, and the rule that fired is shown.",
          null
        ],
        [
          "2 · Tags are not exclusive",
          "A prospect carries as many as apply — in this sample, between 1 and 5.",
          null
        ],
        [
          "3 · A rule never fires on missing data",
          "Every rule checks that the items it reads were actually answered. An unanswered confidence item is never read as a low one.",
          null
        ]
      ],
      "rules": [
        [
          "Deferred Joy",
          "Wants MORE on travel / hobbies / health AND spending-for-joy ≤ 3"
        ],
        [
          "Confidence Gap",
          "Goal belief ≥ 4 AND min(condition, resilience) ≤ 3"
        ],
        [
          "Vision-Action Gap",
          "Vision clarity ≥ 4 AND action = 'Not yet'"
        ],
        [
          "Permission Gap",
          "min(condition, resilience) ≥ 4 AND spending-for-joy ≤ 3"
        ],
        [
          "Decision Fatigue",
          "Freedom-from-regret ≤ 2"
        ],
        [
          "Horizon Mismatch",
          "Goal within 5 years AND steps ≤ 'some ideas' AND no action taken"
        ],
        [
          "Planning Aversion",
          "Financial-planning attention = − Less AND advisor value ≥ 4"
        ],
        [
          "Vision Fog",
          "Vision clarity ≤ 2 AND fewer than 8 ideal-life options chosen"
        ],
        [
          "Solo Future",
          "Future You 'who' includes Solo"
        ],
        [
          "Advisor-Receptive",
          "Advisor value ≥ 4 AND asked for help with the goal"
        ],
        [
          "Self-Directed",
          "Chose to pursue the goal without advisor support"
        ]
      ],
      "example": null
    }
  },
  "contract": [
    [
      "Every label is an exhaustive, disjoint partition",
      "The 40 ideal-life options and the 10 money-purpose options each belong to exactly one group. A validator proves this on every run, and an assertion fails the build if the label set drifts from the partition."
    ],
    [
      "Any answer set resolves to a label",
      "Verified against 30,008 synthetic respondents drawn from the full option space — including all-'Other', all-floor, all-ceiling, single-tag and 15%-completion cases. Zero crashes, zero unlabeled, every label reachable."
    ],
    [
      "Narrative free text never assigns a label",
      "Goals, concerns, hopes and the postcard are read by advisors, not by the models. Scrambling every one of those fields on the 8 real profiles leaves all labels identical. The one exception is deliberate: text typed into an 'Other' box, which may only resolve to an option that already exists."
    ],
    [
      "Missing data is never evidence",
      "Rules keyed on a low score check the item was answered first. Profiles under 55% field coverage are classified but flagged unreliable."
    ],
    [
      "Answers are canonicalised before matching",
      "The export writes 'International Travel'; the schema declares 'International travel'. Exact matching silently dropped it. All answers now match case-insensitively against a synonym table, and an alarm reports anything matching no declared option."
    ]
  ],
  "other": {
    "title": "How 'Other' write-ins are handled",
    "policy": [
      [
        "Approximated toward a declared option",
        "When a client picks 'Other' and types something, a field-scoped lexicon places it onto an option that already exists. 'golf and sailing' becomes Sports + Outdoors. 'second home in the mountains' becomes House + Mountain."
      ],
      [
        "Never creates a new category",
        "A write-in can only ever resolve to something already in the option space. It cannot invent a label, widen a partition, or alter a domain."
      ],
      [
        "If it cannot be placed, it does not count",
        "No match, or 'Other' left blank, and the answer is dropped entirely - in every model, for every use case. It does not inflate any count, any denominator, or any score. The bare token 'Other' never counts anywhere."
      ],
      [
        "Every placement is logged",
        "What the client wrote, which term matched, and which option it resolved to - all visible in the per-prospect trace, so a wrong approximation is findable rather than silent."
      ],
      [
        "Multiple concepts in one write-in all resolve",
        "'a small town overseas' carries a setting and a location; both are recorded. Overlapping matches collapse so 'ski' and 'skiing' cannot double-count the same span."
      ]
    ],
    "lexicon_sizes": [
      [
        "fy_ideal",
        198,
        40,
        40
      ],
      [
        "fy_where",
        23,
        7,
        7
      ],
      [
        "fy_doing",
        26,
        6,
        6
      ],
      [
        "fy_with",
        31,
        6,
        6
      ],
      [
        "money_purpose",
        42,
        10,
        10
      ]
    ],
    "examples": [
      [
        "fy_ideal",
        "golf and sailing",
        "Sports, Outdoors"
      ],
      [
        "fy_ideal",
        "second home in the mountains",
        "House, Mountain"
      ],
      [
        "fy_ideal",
        "RV trips to national parks",
        "Domestic travel, RVing"
      ],
      [
        "fy_ideal",
        "church",
        "— dropped, no declared option matches"
      ],
      [
        "fy_ideal",
        "Other (blank)",
        "— dropped, does not count"
      ],
      [
        "money_purpose",
        "peace of mind",
        "Security"
      ],
      [
        "money_purpose",
        "legacy for my kids",
        "Supporting my family"
      ],
      [
        "money_purpose",
        "crypto moonshot",
        "— dropped"
      ],
      [
        "fy_where",
        "a small town overseas",
        "In the country, Abroad"
      ],
      [
        "fy_with",
        "my wife and buddies",
        "Romantic partner, Friends"
      ],
      [
        "fy_horizon",
        "about 8 years",
        "5-10 years"
      ]
    ],
    "backlog_note": "Dropped write-ins are logged and counted. Ranked by frequency they are a backlog of options the Adventure is missing - the highest-value output of this mechanism, not a failure of it."
  },
  "cuts": {
    "vision": 82.1,
    "readiness": 35.7
  },
  "cutsBasis": "cohort median",
  "proof": {
    "n": 30011,
    "crashes": 0,
    "unlabeled": 0,
    "insufficient": 3230,
    "A": {
      "Contribution": 1388,
      "Home & Table": 2298,
      "Culture & Creativity": 5048,
      "People & Generations": 4506,
      "Work & Enterprise": 4651,
      "Insufficient Signal": 3230,
      "Travel & Exploration": 5303,
      "Place & Setting": 823,
      "Health & Activity": 2764
    },
    "B": {
      "Working on it Liberator": 2172,
      "Uneasy Protector": 3698,
      "Working on it Contributor": 679,
      "Working on it Experiencer": 1259,
      "Working on it Protector": 2229,
      "Uneasy Unstated": 4000,
      "Unrated Unstated": 2484,
      "Uneasy Liberator": 3427,
      "Uneasy Achiever": 1110,
      "Assured Unstated": 906,
      "Uneasy Experiencer": 2249,
      "Uneasy Contributor": 1130,
      "Working on it Unstated": 1854,
      "Assured Liberator": 425,
      "Unrated Protector": 294,
      "Unrated Liberator": 181,
      "Assured Protector": 446,
      "Assured Experiencer": 286,
      "Assured Achiever": 142,
      "Working on it Achiever": 671,
      "Unrated Achiever": 65,
      "Assured Contributor": 117,
      "Unrated Experiencer": 133,
      "Unrated Contributor": 54
    },
    "C": {
      "Ready to Build": 6162,
      "Moving Without a Map": 5368,
      "Not Yet Looking": 13875,
      "Vivid but Stuck": 4606
    },
    "D": {
      "Confidence Gap": 5508,
      "Vision-Action Gap": 1756,
      "Decision Fatigue": 8507,
      "Self-Directed": 10621,
      "Deferred Joy": 7923,
      "Planning Aversion": 2352,
      "Vision Fog": 3276,
      "Solo Future": 7882,
      "Advisor-Receptive": 3611,
      "Permission Gap": 1606,
      "Horizon Mismatch": 833
    },
    "writeinsResolved": 5546,
    "writeinsDropped": 1729,
    "backlog": [
      [
        "studying philosophy",
        388
      ],
      [
        "my dog",
        332
      ],
      [
        "crypto moonshot",
        290
      ],
      [
        "on a boat",
        275
      ],
      [
        "quantum basket weaving",
        153
      ],
      [
        "church",
        152
      ],
      [
        "beekeeping",
        139
      ]
    ]
  },
  "undetectable": [
    [
      "Cash-flow pressure",
      "No closed question asks whether money is tight right now."
    ],
    [
      "Caregiving for a parent",
      "No closed question asks about dependants in either direction."
    ],
    [
      "Business exit / liquidity event",
      "No closed question asks about ownership or an exit."
    ],
    [
      "Health event",
      "No closed question asks about a health change."
    ],
    [
      "Recent windfall or loss",
      "No closed question asks about a change in circumstances."
    ]
  ],
  "lexiconSizes": [
    [
      "fy_ideal",
      198,
      40,
      40
    ],
    [
      "fy_where",
      23,
      7,
      7
    ],
    [
      "fy_doing",
      26,
      6,
      6
    ],
    [
      "fy_with",
      31,
      6,
      6
    ],
    [
      "money_purpose",
      42,
      10,
      10
    ]
  ]
} as const

export const scoredProspects = raw.prospects as unknown as ScoredProspect[]
export const segModels = raw.models as unknown as Record<ModelKey, ModelDef>
export const segMethod = raw.method as unknown as Record<ModelKey, MethodDef>
export const segContract = raw.contract as unknown as string[][]
export const otherPolicy = raw.other as unknown as {
  title: string
  policy: string[][]
  lexicon_sizes: (string | number)[][]
  examples: string[][]
  backlog_note: string
}
export const segCuts = raw.cuts as { vision: number; readiness: number }
export const segCutsBasis = raw.cutsBasis as string
export const segProof = raw.proof as unknown as {
  n: number
  crashes: number
  unlabeled: number
  insufficient: number
  A: Record<string, number>
  B: Record<string, number>
  C: Record<string, number>
  D: Record<string, number>
  writeinsResolved: number
  writeinsDropped: number
  backlog: [string, number][]
}
export const undetectable = raw.undetectable as unknown as string[][]
export const lexiconSizes = raw.lexiconSizes as unknown as (string | number)[][]

/** Which segment(s) a prospect holds under a given model. */
export function segmentsOf(p: ScoredProspect, m: ModelKey): string[] {
  if (m === 'A') return [p.a.segment, ...(p.a.secondary ? [p.a.secondary] : [])]
  if (m === 'B') return [p.b.family]
  if (m === 'C') return [p.c.segment]
  return p.d.map((t) => t.tag)
}

/** Segment -> prospects, for every segment the model declares (including empty ones,
 *  which are the point: they are the audiences the marketing is not reaching). */
export function segmentMix(m: ModelKey): { seg: SegmentDef; holders: ScoredProspect[] }[] {
  return segModels[m].segments.map((seg) => ({
    seg,
    holders: scoredProspects.filter((p) => segmentsOf(p, m).includes(seg.name)),
  }))
}
