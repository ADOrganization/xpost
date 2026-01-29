import { X_GROWTH_SYSTEM_PREAMBLE } from "@/lib/x-principles";

export type AiAction =
  | "rewrite"
  | "improve"
  | "shorter"
  | "longer"
  | "thread"
  | "tone_professional"
  | "tone_casual"
  | "tone_witty"
  | "tone_informative"
  | "from_url";

const ACTION_INSTRUCTIONS: Record<AiAction, string> = {
  rewrite:
    "Rewrite this tweet to say the same thing in a fresh, engaging way. Keep the same meaning and approximate length. Return ONLY the rewritten tweet text, no explanation.",
  improve:
    "Improve this tweet for clarity, engagement, and impact. Make the hook punchier, the formatting scannable (one sentence per line), and the value immediately obvious. Return ONLY the improved tweet text, no explanation.",
  shorter:
    "Make this tweet significantly shorter while keeping the key message. Cut every word that doesn't earn its place. Return ONLY the shortened tweet text, no explanation.",
  longer:
    "Expand this tweet with actionable detail — walk through the process step by step. Keep it under 280 characters. Use line breaks for readability. Return ONLY the expanded tweet text, no explanation.",
  thread:
    "Convert this idea into a Twitter thread of 3-5 tweets. The first tweet MUST be a scroll-stopping hook. Each following tweet delivers step-by-step actionable value. Each tweet under 280 characters. Number them 1/, 2/, etc. Return ONLY the thread tweets, each on a new line separated by ---.",
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
