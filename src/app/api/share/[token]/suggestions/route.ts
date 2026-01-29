import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TWEET_CHAR_LIMIT } from "@/lib/constants";

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

    const suggestions = await prisma.shareSuggestion.findMany({
      where: { shareLinkId: shareLink.id },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("GET /api/share/[token]/suggestions error:", error);
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
    const threadItemPosition =
      typeof body.threadItemPosition === "number" ? body.threadItemPosition : null;
    const suggestedText =
      typeof body.suggestedText === "string" ? body.suggestedText.trim() : "";
    const note =
      typeof body.note === "string" ? body.note.trim() || null : null;

    if (threadItemPosition === null || threadItemPosition < 0) {
      return NextResponse.json(
        { error: "threadItemPosition is required" },
        { status: 400 }
      );
    }

    if (!suggestedText) {
      return NextResponse.json(
        { error: "suggestedText is required" },
        { status: 400 }
      );
    }

    if (suggestedText.length > TWEET_CHAR_LIMIT) {
      return NextResponse.json(
        { error: `suggestedText must be ${TWEET_CHAR_LIMIT} characters or less` },
        { status: 400 }
      );
    }

    const suggestion = await prisma.shareSuggestion.create({
      data: {
        shareLinkId: shareLink.id,
        userId: session.user.id,
        threadItemPosition,
        suggestedText,
        note,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({ suggestion }, { status: 201 });
  } catch (error) {
    console.error("POST /api/share/[token]/suggestions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
