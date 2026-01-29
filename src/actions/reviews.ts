"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notify";
import { logActivity } from "@/lib/activity";

type ActionResult = { success: boolean; error?: string };

export async function submitForReview(postId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { success: false, error: "Post not found" };
  if (post.status !== "DRAFT") {
    return { success: false, error: "Only drafts can be submitted for review" };
  }

  await prisma.post.update({
    where: { id: postId },
    data: { status: "IN_REVIEW" },
  });

  await prisma.postReview.create({
    data: { postId, userId: session.user.id, status: "PENDING" },
  });

  // Notify workspace owners/editors
  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId: post.workspaceId,
      role: { in: ["OWNER", "EDITOR"] },
      userId: { not: session.user.id },
    },
    select: { userId: true },
  });

  const userName = session.user.name || session.user.email || "Someone";
  for (const member of members) {
    await createNotification({
      userId: member.userId,
      type: "review_requested",
      title: "Review requested",
      body: `${userName} submitted a post for review`,
      postId,
    });
  }

  await logActivity({
    workspaceId: post.workspaceId,
    userId: session.user.id,
    action: "review_submitted",
    postId,
  });

  return { success: true };
}

export async function approvePost(postId: string, note?: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { success: false, error: "Post not found" };
  if (post.status !== "IN_REVIEW") {
    return { success: false, error: "Post is not in review" };
  }

  await prisma.post.update({
    where: { id: postId },
    data: { status: "DRAFT" },
  });

  await prisma.postReview.create({
    data: { postId, userId: session.user.id, status: "APPROVED", note },
  });

  // Notify the post creator
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: post.workspaceId },
    select: { userId: true },
  });

  const userName = session.user.name || session.user.email || "Someone";
  for (const member of members) {
    if (member.userId !== session.user.id) {
      await createNotification({
        userId: member.userId,
        type: "review_approved",
        title: "Post approved",
        body: `${userName} approved a post${note ? `: "${note.slice(0, 80)}"` : ""}`,
        postId,
      });
    }
  }

  await logActivity({
    workspaceId: post.workspaceId,
    userId: session.user.id,
    action: "review_approved",
    details: note,
    postId,
  });

  return { success: true };
}

export async function requestChanges(postId: string, note: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { success: false, error: "Post not found" };
  if (post.status !== "IN_REVIEW") {
    return { success: false, error: "Post is not in review" };
  }

  await prisma.post.update({
    where: { id: postId },
    data: { status: "DRAFT" },
  });

  await prisma.postReview.create({
    data: { postId, userId: session.user.id, status: "CHANGES_REQUESTED", note },
  });

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: post.workspaceId },
    select: { userId: true },
  });

  const userName = session.user.name || session.user.email || "Someone";
  for (const member of members) {
    if (member.userId !== session.user.id) {
      await createNotification({
        userId: member.userId,
        type: "changes_requested",
        title: "Changes requested",
        body: `${userName} requested changes: "${note.slice(0, 80)}"`,
        postId,
      });
    }
  }

  await logActivity({
    workspaceId: post.workspaceId,
    userId: session.user.id,
    action: "changes_requested",
    details: note,
    postId,
  });

  return { success: true };
}
