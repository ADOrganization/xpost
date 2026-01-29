// ---------------------------------------------------------------------------
// X Posting Principles — Growth methodology for viral content
// ---------------------------------------------------------------------------

/**
 * System prompt preamble injected into all AI assist actions.
 * Trains the AI to produce content that follows proven X growth patterns.
 */
export const X_GROWTH_SYSTEM_PREAMBLE = `You are an expert X (Twitter) growth strategist. Every piece of content you produce MUST follow these principles:

ALGORITHM PILLARS (January 2026):
1. Articles are heavily boosted — structure long-form insights with clear sections
2. Quote tweets multiply reach — reference others' content or your own previous posts when relevant
3. Media is king — images and videos drive engagement the algorithm rewards

WRITING RULES:
- Genuine value only. No recycled advice. Fresh insights from real experience that make people stop scrolling. Ask: would I bookmark this if someone else wrote it?
- Immediately actionable. Walk through processes step by step. "How to X" beats "X is amazing" every time. Insights without blueprints are entertainment, not education.
- Natural engagement triggers. Never use "like if you agree" desperation. Structure content so bookmarks happen instinctively (hooks like "here's how" or "do this"). For replies, push a controversial stance or invite perspectives.
- Ridiculously easy to read. One sentence per line. Short punchy hooks. Use "-" or ">" for lists. White space matters. Simplify language: "use" not "utilize", "help" not "facilitate". A 14-year-old should be able to follow it.
- Recognizable style. Use structural patterns consistently: ">" for breakdowns, numbered steps, punchy one-liners as openers.

FORMAT RULES:
- One sentence per line
- Short punchy hook as the first line
- Use "-" or ">" for lists, never bullet points or asterisks
- Keep dense blocks broken up with white space
- Simple language always`;

/**
 * Tooltip tips shown in the compose UI to teach growth principles.
 * Each tip is contextual to where it appears in the interface.
 */
export const COMPOSE_TIPS = {
  textarea:
    "Start with a punchy one-liner hook. One sentence per line. If a 14-year-old can't follow it, simplify.",
  media:
    "Media is king on X. Images and videos get clicks, and the algorithm rewards that engagement. Use them often.",
  aiAssist:
    "AI will follow X growth principles: actionable value, easy-to-read formatting, natural engagement hooks.",
  charCount:
    "Shorter posts get more engagement. Every word should earn its place.",
  thread:
    "Threads let you go deep. Open with a hook that stops the scroll, then deliver step-by-step value.",
  poll:
    "Polls drive replies and engagement. Ask something your audience has a strong opinion on.",
  schedule:
    "Post when your audience is online. Test different times and track which slots get the most reach.",
} as const;

/**
 * Descriptions for each AI action, shown as subtitles in the AI Assist popover.
 * These teach users what each action does through the lens of growth principles.
 */
export const AI_ACTION_DESCRIPTIONS: Record<string, string> = {
  rewrite: "Fresh angle, same message — avoid sounding recycled",
  improve: "Punchier hooks, cleaner formatting, stronger value",
  shorter: "Cut the fluff. Every word should earn its spot",
  longer: "Add actionable detail — blueprints beat opinions",
  thread: "Split into a step-by-step thread with a scroll-stopping hook",
};
