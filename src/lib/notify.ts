"use server";

import { prisma } from "@/lib/prisma";

export async function createNotification({
  userId,
  type,
  title,
  body,
  postId,
}: {
  userId: string;
  type: string;
  title: string;
  body: string;
  postId?: string;
}) {
  return prisma.notification.create({
    data: { userId, type, title, body, postId },
  });
}

export async function notifyWorkspaceMembers({
  workspaceId,
  excludeUserId,
  type,
  title,
  body,
  postId,
}: {
  workspaceId: string;
  excludeUserId?: string;
  type: string;
  title: string;
  body: string;
  postId?: string;
}) {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  });

  const userIds = members
    .map((m) => m.userId)
    .filter((id) => id !== excludeUserId);

  if (userIds.length === 0) return;

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      title,
      body,
      postId,
    })),
  });
}
