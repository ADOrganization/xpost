import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        post: {
          include: {
            threadItems: {
              orderBy: { position: "asc" },
              include: {
                media: { orderBy: { position: "asc" } },
                pollOptions: { orderBy: { position: "asc" } },
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
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        suggestions: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!shareLink || !shareLink.active) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return NextResponse.json({ error: "Share link expired" }, { status: 404 });
    }

    return NextResponse.json({
      post: shareLink.post,
      comments: shareLink.comments,
      suggestions: shareLink.suggestions,
      shareLinkId: shareLink.id,
    });
  } catch (error) {
    console.error("GET /api/share/[token] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
