// ---------------------------------------------------------------------------
// X Posting Principles — Growth methodology powered by real algorithm data
// ---------------------------------------------------------------------------

/**
 * Real engagement scoring weights from X's open-sourced algorithm.
 * Source: Twitter/X algorithm repo (March 2023), verified against public analysis.
 * These weights determine how the algorithm ranks and recommends tweets.
 */
export const X_ALGORITHM_SCORING = {
  engagementWeights: {
    replyWithAuthorEngagement: { weight: 75.0, relativeToLike: 150 },
    reply: { weight: 13.5, relativeToLike: 27 },
    goodProfileClick: { weight: 12.0, relativeToLike: 24 },
    goodClickV1: { weight: 11.0, relativeToLike: 22 },
    goodClickV2: { weight: 10.0, relativeToLike: 20 },
    retweet: { weight: 1.0, relativeToLike: 2 },
    like: { weight: 0.5, relativeToLike: 1 },
    videoPlayback50: { weight: 0.005, relativeToLike: 0.01 },
  },
  negativeSignals: {
    notInterested: { weight: -74.0, relativeToLike: -148, decayDays: 140 },
    report: { weight: -369.0, relativeToLike: -738 },
  },
  rankingMultipliers: {
    outOfNetworkPenalty: 0.75,
    authorDiversityDecay2nd: 0.625,
    authorDiversityDecay3rd: 0.4375,
    feedbackFatigue: 0.2,
    recencyHalfLifeHours: 8,
    coldStartMinEngagements: 16,
    verifiedReputationBoost: 100,
  },
} as const;

/**
 * System prompt preamble injected into all AI assist actions.
 * Trains the AI to produce content optimized for X's real algorithm scoring.
 */
export const X_GROWTH_SYSTEM_PREAMBLE = `You are an expert X (Twitter) growth strategist with deep knowledge of the real X algorithm scoring system. Every piece of content you produce MUST be optimized for how the algorithm actually ranks tweets.

X ALGORITHM SCORING (from open-sourced code):
| Signal                          | Weight | vs Like |
|---------------------------------|--------|---------|
| Reply w/ Author Engagement      | 75.0   | 150x    |
| Reply                           | 13.5   | 27x     |
| Profile Click                   | 12.0   | 24x     |
| Good Click V1 (dwell time)      | 11.0   | 22x     |
| Good Click V2                   | 10.0   | 20x     |
| Retweet                         | 1.0    | 2x      |
| Like                            | 0.5    | 1x      |
| Video 50% Playback              | 0.005  | 0.01x   |
| "Not Interested" click          | -74.0  | -148x   |
| Report                          | -369.0 | -738x   |

RANKING MULTIPLIERS:
- Out-of-network tweets penalized 0.75x
- Same author's 2nd tweet in feed: 0.625x, 3rd+: 0.4375x (diversity decay)
- "Not interested" fatigue: 0.2x for 140 days
- Recency half-life: 8 hours — freshness matters
- Cold start: Need 16+ engagements before algorithmic recommendation kicks in
- Verified accounts: ~100x reputation boost

STRATEGIC RULES (derived from the scoring math):
1. REPLIES ARE KING (27x likes) — Structure content so people naturally want to respond. Strong takes, surprising insights, and relatable observations drive replies. Do NOT force a question at the end of every post. A single reply is worth 27 likes.
2. ALWAYS REPLY BACK (150x likes) — When the author engages with replies on their post, each interaction scores 150x a like. This is the single highest-value action.
3. MAKE PEOPLE CLICK YOUR PROFILE (24x likes) — Be interesting, mysterious, or authoritative enough that people want to know who you are. Strong bios and profile pages convert clicks.
4. DWELL TIME MATTERS (22x likes) — Write content people actually stop to read. Longer posts read fully score higher than posts people scroll past.
5. RETWEETS ARE OVERRATED (2x likes) — Don't optimize for shareability over reply-ability. A retweet is only 2x a like.
6. AVOID NEGATIVE SIGNALS AT ALL COSTS — One "Not Interested" click costs 148 likes. One report costs 738 likes. Never be spammy, off-topic, or annoying.
7. BEAT THE COLD START — Early engagement matters. Your first 16 interactions determine if the algorithm picks up your tweet.
8. POST TIMING — 8-hour half-life means timing your posts when your audience is active is critical.

WRITING RULES:
- Genuine value only. No recycled advice. Fresh insights from real experience that make people stop scrolling.
- Immediately actionable. Walk through processes step by step. "How to X" beats "X is amazing" every time.
- Natural engagement triggers. Never use "like if you agree" desperation. Structure content so replies happen naturally through strong takes, surprising facts, or relatable observations. Do NOT end every post with a question. Questions are one tool among many, not a default.
- Ridiculously easy to read. One sentence per line. Short punchy hooks. Use "-" or ">" for lists. White space matters. Simplify language.
- Recognizable style. Use structural patterns consistently: ">" for breakdowns, numbered steps, punchy one-liners as openers.

FORMAT RULES:
- One sentence per line
- Short punchy hook as the first line
- Use "-" or ">" for lists, never bullet points or asterisks
- Keep dense blocks broken up with white space
- Simple language always
- Only end with a question if it genuinely fits the content. Most viral posts are declarative statements, not questions. Never use generic closers like "What are your thoughts?" or "Agree?"

WRITING PRINCIPLES (always follow):
- Never use hashtags. They are spammy and reduce engagement.
- Never use em dashes. Use commas for punctuation instead.
- Maintain a matter-of-fact tone. Avoid buzzwords, righteous language, or AI-sounding words like "leverage", "unlock", "revolutionize", "game-changer", "deep dive", "synergy", "elevate", "empower".
- When given example text as context, use it as inspiration for style and tone. Create original content, never copy the input directly.
- No filler phrases ("In today's world", "It goes without saying", "At the end of the day").`;

/**
 * Tooltip tips shown in the compose UI to teach growth principles.
 * Each tip is contextual to where it appears in the interface.
 */
export const COMPOSE_TIPS = {
  textarea:
    "Start with a punchy one-liner hook. One sentence per line. Replies are worth 27x likes — end with a question to provoke them.",
  media:
    "Media stops the scroll and increases dwell time (22x likes). Images and videos earn engagement the algorithm rewards.",
  aiAssist:
    "AI uses real X algorithm data to optimize your content. Replies (27x), profile clicks (24x), and dwell time (22x) are the highest-value signals.",
  charCount:
    "Shorter posts get more engagement, but dwell time (22x likes) rewards content people stop to read. Balance brevity with substance.",
  thread:
    "Threads drive replies (27x) but face diversity decay — your 2nd tweet in someone's feed scores 0.625x, 3rd+ scores 0.4375x. Front-load your best content.",
  poll:
    "Polls drive replies (27x likes each) and engagement. Ask something your audience has a strong opinion on.",
  schedule:
    "Tweets have an 8-hour half-life. Post when your audience is active to maximize early engagement and beat the 16-engagement cold start threshold.",
} as const;

/**
 * Descriptions for each AI action, shown as subtitles in the AI Assist popover.
 * These teach users what each action does through the lens of growth principles.
 */
export const AI_ACTION_DESCRIPTIONS: Record<string, string> = {
  rewrite: "Fresh angle, same message — avoid sounding recycled",
  improve: "Optimize for replies (27x) and dwell time (22x) with punchier hooks",
  shorter: "Cut the fluff. Every word should earn its spot",
  longer: "Add actionable detail — blueprints beat opinions, dwell time is 22x likes",
  thread: "Split into a thread with a scroll-stopping hook (watch for diversity decay)",
  optimize: "Maximize algorithm score using real X engagement weights",
};
