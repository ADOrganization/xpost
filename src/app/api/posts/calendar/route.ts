import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

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

    const targetDate = new Date(year, month - 1, 1);
    const rangeStart = startOfMonth(targetDate);
    const rangeEnd = endOfMonth(targetDate);

    const posts = await prisma.post.findMany({
      where: {
        workspaceId,
        status: { in: ["SCHEDULED", "PUBLISHED", "FAILED"] },
        scheduledAt: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      include: {
        threadItems: {
          orderBy: { position: "asc" },
          take: 1,
          select: { id: true, position: true, text: true },
        },
        xAccount: {
          select: { username: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("GET /api/posts/calendar error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
