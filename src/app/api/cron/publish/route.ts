import { NextRequest, NextResponse } from "next/server";
import { publishScheduledPosts } from "@/lib/publisher";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await publishScheduledPosts();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron publish error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
