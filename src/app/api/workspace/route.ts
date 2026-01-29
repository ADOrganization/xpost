import { NextResponse } from "next/server";
import { getActiveWorkspace } from "@/lib/workspace";

export async function GET() {
  try {
    const { workspace } = await getActiveWorkspace();
    return NextResponse.json({ workspaceId: workspace.id });
  } catch {
    return NextResponse.json({ workspaceId: null }, { status: 401 });
  }
}
