"use server";

import { prisma } from "@/lib/prisma";

export async function logActivity({
  workspaceId,
  userId,
  action,
  details,
  postId,
}: {
  workspaceId: string;
  userId: string;
  action: string;
  details?: string;
  postId?: string;
}) {
  return prisma.activityLog.create({
    data: { workspaceId, userId, action, details, postId },
  });
}
