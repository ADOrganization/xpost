import { X_GROWTH_SYSTEM_PREAMBLE } from "@/lib/x-principles";

export type AiAction =
  | "rewrite"
  | "improve"
  | "shorter"
  | "longer"
  | "thread"
  | "optimize"
  | "tone_professional"
  | "tone_casual"
  | "tone_witty"
  | "tone_informative"
  | "from_url"
  | "generate_single"
  | "generate_thread";

const ACTION_INSTRUCTIONS: Record<AiAction, string> = {
  rewrite:
    "Rewrite this tweet to say the same thing in a fresh, engaging way. Keep the same meaning and approximate length. Return ONLY the rewritten tweet text, no explanation.",
  improve:
    "Improve this tweet for maximum algorithmic reach. Make the hook punchier, the formatting scannable (one sentence per line), and structure it so people naturally want to reply. Optimize dwell time by making every line worth reading. Do NOT add a question at the end unless one already exists or genuinely fits. Return ONLY the improved tweet text, no explanation.",
  shorter:
    "Make this tweet significantly shorter while keeping the key message. Cut every word that doesn't earn its place. Return ONLY the shortened tweet text, no explanation.",
  longer:
    "Expand this tweet with actionable detail — walk through the process step by step. Keep it under 280 characters. Use line breaks for readability. Optimize for dwell time (22x likes) by making every line substantive. Return ONLY the expanded tweet text, no explanation.",
  thread:
    "Convert this idea into a Twitter thread of 3-5 tweets. The first tweet MUST be a scroll-stopping hook. Each following tweet delivers step-by-step actionable value. Each tweet under 280 characters. Number them 1/, 2/, etc. Note: the algorithm applies diversity decay (0.625x for 2nd tweet, 0.4375x for 3rd+) so front-load your strongest content in tweet 1. Return ONLY the thread tweets, each on a new line separated by ---.",
  optimize:
    `Rewrite this tweet to maximize its X algorithm score based on real engagement weights. Apply these specific optimizations:

1. REPLY OPTIMIZATION (replies = 27x likes): Structure the content so people naturally want to respond. Strong takes, surprising insights, and relatable observations work better than forced questions. Do NOT default to ending with a question. Make people want to respond, not just like.

2. DWELL TIME (good clicks = 22x likes): Write content that stops the scroll. Use a strong hook, then deliver enough substance that people read the whole thing. One sentence per line for readability.

3. PROFILE CLICK BAIT (24x likes): Include an insight or credential hint that makes the reader curious about who wrote this. Demonstrate authority or unique perspective.

4. AVOID NEGATIVE SIGNALS (-148x for "Not Interested"): Keep content on-topic, valuable, and non-spammy. No engagement bait ("like if you agree"), no off-putting tone.

5. COLD START (need 16+ engagements): Make the first line so compelling that early viewers immediately engage, pushing the tweet into algorithmic recommendation.

Return ONLY the optimized tweet text, no explanation.`,
  tone_professional:
    "Rewrite this tweet in a professional, authoritative tone while keeping it scannable and punchy. Return ONLY the rewritten tweet text, no explanation.",
  tone_casual:
    "Rewrite this tweet in a casual, conversational tone — like talking to a friend. Keep it scannable. Return ONLY the rewritten tweet text, no explanation.",
  tone_witty:
    "Rewrite this tweet in a witty, clever tone with personality. Make people want to bookmark it. Return ONLY the rewritten tweet text, no explanation.",
  tone_informative:
    "Rewrite this tweet in an informative, educational tone. Walk through the insight step by step. Return ONLY the rewritten tweet text, no explanation.",
  from_url:
    "Based on the content from this URL, create an engaging tweet thread (3-5 tweets) summarizing the key points. First tweet must be a scroll-stopping hook. Each tweet under 280 characters. Number them 1/, 2/, etc. Return ONLY the thread tweets, each on a new line separated by ---.",
  generate_single:
    "Create a polished single tweet from the given context/topic. Optimize for dwell time (22x likes) and natural reply triggers. Start with a strong hook that stops the scroll. Max 280 characters. Do not end with a question unless it genuinely fits. Do not copy the input text directly, use it as inspiration and context to create original content. Return ONLY the tweet text, no explanation.",
  generate_thread:
    "Create a 3-6 tweet thread from the given context/topic. Tweet 1 MUST be a scroll-stopping hook. Deliver actionable value in each following tweet. Number them 1/, 2/, etc. End the thread with a strong closing statement, not a forced question. Front-load your strongest content (diversity decay: 2nd tweet 0.625x, 3rd+ 0.4375x). Each tweet under 280 characters. Do not copy the input text directly, use it as inspiration and context to create original content. Return ONLY the thread tweets separated by ---.",
};

export async function generateAiContent(
  action: AiAction,
  text: string,
  apiKey: string
): Promise<string> {
  const systemPrompt = `${X_GROWTH_SYSTEM_PREAMBLE}\n\nTASK:\n${ACTION_INSTRUCTIONS[action]}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`AI generation failed: ${error}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content?.trim() ?? "";
}
