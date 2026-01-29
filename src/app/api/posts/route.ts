import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

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
    const where: {
      workspaceId: string;
      status?: "DRAFT" | "SCHEDULED" | "PUBLISHING" | "PUBLISHED" | "FAILED";
    } = { workspaceId };

    if (
      status &&
      ["DRAFT", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED"].includes(
        status
      )
    ) {
      where.status = status as typeof where.status;
    }

    // Determine ordering: SCHEDULED by scheduledAt ASC, others by createdAt DESC
    const orderBy =
      status === "SCHEDULED"
        ? { scheduledAt: "asc" as const }
        : { createdAt: "desc" as const };

    const posts = await prisma.post.findMany({
      where,
      include: {
        threadItems: {
          orderBy: { position: "asc" },
          include: {
            images: {
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
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
