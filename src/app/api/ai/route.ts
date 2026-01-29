import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateAiContent, type AiAction } from "@/lib/ai";
import { getUserOpenAiKey } from "@/actions/user-settings";
import { rateLimit } from "@/lib/rate-limit";

const VALID_ACTIONS: AiAction[] = [
  "rewrite", "improve", "shorter", "longer", "thread", "optimize",
  "tone_professional", "tone_casual", "tone_witty",
  "tone_informative", "from_url", "generate_single", "generate_thread",
];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = rateLimit(`ai:${session.user.id}`, 20, 60 * 1000);
  if (!success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const body = await request.json();
  const { action, text } = body;

  if (!action || !VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  // Get the user's own API key
  const apiKey = await getUserOpenAiKey(session.user.id);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Add your OpenAI API key in Settings to use AI Assist" },
      { status: 403 }
    );
  }

  try {
    const result = await generateAiContent(action, text, apiKey);
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
