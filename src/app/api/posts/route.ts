import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const q = searchParams.get("q");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const xAccountId = searchParams.get("xAccountId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Verify the user is a member of the workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this workspace" },
        { status: 403 }
      );
    }

    // Build the where clause
    const where: Record<string, unknown> = { workspaceId };

    const validStatuses = ["DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED"];
    if (status && validStatuses.includes(status)) {
      where.status = status;
    }

    if (xAccountId) {
      where.xAccountId = xAccountId;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    // Text search across thread items
    if (q) {
      where.threadItems = {
        some: {
          text: { contains: q, mode: "insensitive" },
        },
      };
    }

    // Determine ordering: SCHEDULED by scheduledAt ASC, others by createdAt DESC
    const orderBy =
      status === "SCHEDULED"
        ? { scheduledAt: "asc" as const }
        : { createdAt: "desc" as const };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          threadItems: {
            orderBy: { position: "asc" },
            include: {
              media: {
                orderBy: { position: "asc" },
              },
            },
          },
          xAccount: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImageUrl: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      total,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
