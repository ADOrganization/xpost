"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notify";
import { logActivity } from "@/lib/activity";

type ActionResult = { success: boolean; error?: string };

export async function addComment(postId: string, text: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const trimmed = text.trim();
  if (!trimmed) return { success: false, error: "Comment cannot be empty" };

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { workspaceId: true },
  });
  if (!post) return { success: false, error: "Post not found" };

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: post.workspaceId, userId: session.user.id },
    },
  });
  if (!membership) return { success: false, error: "Not a workspace member" };

  await prisma.comment.create({
    data: { postId, userId: session.user.id, text: trimmed },
  });

  // Notify other workspace members
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: post.workspaceId },
    select: { userId: true },
  });

  const userName = session.user.name || session.user.email || "Someone";
  for (const member of members) {
    if (member.userId !== session.user.id) {
      await createNotification({
        userId: member.userId,
        type: "comment",
        title: "New comment",
        body: `${userName} commented on a post: "${trimmed.slice(0, 80)}"`,
        postId,
      });
    }
  }

  await logActivity({
    workspaceId: post.workspaceId,
    userId: session.user.id,
    action: "comment_added",
    details: trimmed.slice(0, 100),
    postId,
  });

  return { success: true };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) return { success: false, error: "Comment not found" };
  if (comment.userId !== session.user.id) {
    return { success: false, error: "You can only delete your own comments" };
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return { success: true };
}
