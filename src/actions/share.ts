"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Helpers ───

async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function checkWorkspaceMembership(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  });
  return !!membership;
}

// ─── Server Actions ───

export async function createShareLink(postId: string) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false as const, error: "Not authenticated" };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { workspaceId: true },
  });

  if (!post) {
    return { success: false as const, error: "Post not found" };
  }

  const isMember = await checkWorkspaceMembership(userId, post.workspaceId);
  if (!isMember) {
    return { success: false as const, error: "Not a member of this workspace" };
  }

  // Reuse existing active link if one exists
  const existing = await prisma.shareLink.findFirst({
    where: { postId, active: true },
  });

  if (existing) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return {
      success: true as const,
      shareLinkId: existing.id,
      token: existing.token,
      url: `${baseUrl}/share/${existing.token}`,
    };
  }

  const link = await prisma.shareLink.create({
    data: {
      postId,
      createdBy: userId,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return {
    success: true as const,
    shareLinkId: link.id,
    token: link.token,
    url: `${baseUrl}/share/${link.token}`,
  };
}

export async function revokeShareLink(shareLinkId: string) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false as const, error: "Not authenticated" };
  }

  const link = await prisma.shareLink.findUnique({
    where: { id: shareLinkId },
    include: { post: { select: { workspaceId: true } } },
  });

  if (!link) {
    return { success: false as const, error: "Share link not found" };
  }

  const isMember = await checkWorkspaceMembership(userId, link.post.workspaceId);
  if (!isMember) {
    return { success: false as const, error: "Not a member of this workspace" };
  }

  await prisma.shareLink.update({
    where: { id: shareLinkId },
    data: { active: false },
  });

  return { success: true as const };
}

export async function getShareLinks(postId: string) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false as const, error: "Not authenticated" };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { workspaceId: true },
  });

  if (!post) {
    return { success: false as const, error: "Post not found" };
  }

  const isMember = await checkWorkspaceMembership(userId, post.workspaceId);
  if (!isMember) {
    return { success: false as const, error: "Not a member of this workspace" };
  }

  const links = await prisma.shareLink.findMany({
    where: { postId },
    include: {
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true as const, links };
}
