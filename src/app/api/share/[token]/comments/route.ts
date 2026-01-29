import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      select: { id: true, active: true, expiresAt: true },
    });

    if (!shareLink || !shareLink.active) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return NextResponse.json({ error: "Share link expired" }, { status: 404 });
    }

    const comments = await prisma.shareComment.findMany({
      where: { shareLinkId: shareLink.id },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET /api/share/[token]/comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;

    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      select: { id: true, active: true, expiresAt: true },
    });

    if (!shareLink || !shareLink.active) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return NextResponse.json({ error: "Share link expired" }, { status: 404 });
    }

    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "Comment must be 2000 characters or less" }, { status: 400 });
    }

    const comment = await prisma.shareComment.create({
      data: {
        shareLinkId: shareLink.id,
        userId: session.user.id,
        content,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/share/[token]/comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
