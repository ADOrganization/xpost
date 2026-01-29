import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const workspaceId = searchParams.get("workspaceId");
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));
  const cursor = searchParams.get("cursor");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where: Record<string, unknown> = { workspaceId };
  if (cursor) {
    where.createdAt = { lt: new Date(cursor) };
  }

  try {
    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      logs,
      nextCursor: logs.length === limit ? logs[logs.length - 1].createdAt.toISOString() : null,
    });
  } catch {
    return NextResponse.json({ logs: [], nextCursor: null });
  }
}
