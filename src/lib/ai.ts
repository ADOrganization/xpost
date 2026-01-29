const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export type AiAction =
  | "rewrite"
  | "improve"
  | "shorter"
  | "longer"
  | "thread"
  | "hashtags"
  | "tone_professional"
  | "tone_casual"
  | "tone_witty"
  | "tone_informative"
  | "from_url";

const PROMPTS: Record<AiAction, string> = {
  rewrite:
    "Rewrite this tweet to say the same thing in a fresh, engaging way. Keep the same meaning and approximate length. Return ONLY the rewritten tweet text, no explanation.",
  improve:
    "Improve this tweet for clarity, engagement, and impact. Make it more compelling while keeping the core message. Return ONLY the improved tweet text, no explanation.",
  shorter:
    "Make this tweet significantly shorter while keeping the key message. Return ONLY the shortened tweet text, no explanation.",
  longer:
    "Expand this tweet with more detail and context while keeping it under 280 characters. Return ONLY the expanded tweet text, no explanation.",
  thread:
    "Convert this idea into a Twitter thread of 3-5 tweets. Each tweet should be under 280 characters. Number them 1/, 2/, etc. Return ONLY the thread tweets, each on a new line separated by ---.",
  hashtags:
    "Suggest 3-5 relevant hashtags for this tweet. Return ONLY the hashtags separated by spaces, no explanation.",
  tone_professional:
    "Rewrite this tweet in a professional, authoritative tone. Return ONLY the rewritten tweet text, no explanation.",
  tone_casual:
    "Rewrite this tweet in a casual, conversational tone. Return ONLY the rewritten tweet text, no explanation.",
  tone_witty:
    "Rewrite this tweet in a witty, clever tone with personality. Return ONLY the rewritten tweet text, no explanation.",
  tone_informative:
    "Rewrite this tweet in an informative, educational tone. Return ONLY the rewritten tweet text, no explanation.",
  from_url:
    "Based on the content from this URL, create an engaging tweet thread (3-5 tweets) summarizing the key points. Each tweet should be under 280 characters. Number them 1/, 2/, etc. Return ONLY the thread tweets, each on a new line separated by ---.",
};

export async function generateAiContent(
  action: AiAction,
  text: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("AI features require OPENAI_API_KEY to be configured");
  }

  const systemPrompt = PROMPTS[action];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
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
