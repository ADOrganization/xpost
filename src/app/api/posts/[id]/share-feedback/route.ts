import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { workspaceId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: post.workspaceId,
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

    const shareLinks = await prisma.shareLink.findMany({
      where: { postId, active: true },
      include: {
        comments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        suggestions: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Also fetch the current thread items so the dialog can show original text for diffing
    const threadItems = await prisma.threadItem.findMany({
      where: { postId },
      orderBy: { position: "asc" },
      select: { position: true, text: true },
    });

    // Flatten all comments and suggestions across share links
    const comments = shareLinks.flatMap((link) => link.comments);
    const suggestions = shareLinks.flatMap((link) => link.suggestions);

    return NextResponse.json({ comments, suggestions, threadItems });
  } catch (error) {
    console.error("GET /api/posts/[id]/share-feedback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
