"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

type ActionResult = { success: boolean; error?: string; count?: number };

async function checkAccess(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  return membership && ["OWNER", "EDITOR"].includes(membership.role);
}

export async function bulkDelete(
  postIds: string[],
  workspaceId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const hasAccess = await checkAccess(session.user.id, workspaceId);
  if (!hasAccess) return { success: false, error: "No permission" };

  const { count } = await prisma.post.deleteMany({
    where: {
      id: { in: postIds },
      workspaceId,
      status: { in: ["DRAFT", "SCHEDULED", "FAILED", "IN_REVIEW"] },
    },
  });

  await logActivity({
    workspaceId,
    userId: session.user.id,
    action: "bulk_delete",
    details: `Deleted ${count} posts`,
  });

  return { success: true, count };
}

export async function bulkMoveToDraft(
  postIds: string[],
  workspaceId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const hasAccess = await checkAccess(session.user.id, workspaceId);
  if (!hasAccess) return { success: false, error: "No permission" };

  const { count } = await prisma.post.updateMany({
    where: {
      id: { in: postIds },
      workspaceId,
      status: { in: ["SCHEDULED", "FAILED", "IN_REVIEW"] },
    },
    data: { status: "DRAFT", scheduledAt: null },
  });

  await logActivity({
    workspaceId,
    userId: session.user.id,
    action: "bulk_move_to_draft",
    details: `Moved ${count} posts to draft`,
  });

  return { success: true, count };
}

export async function bulkReschedule(
  postIds: string[],
  workspaceId: string,
  scheduledAt: Date
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const hasAccess = await checkAccess(session.user.id, workspaceId);
  if (!hasAccess) return { success: false, error: "No permission" };

  const { count } = await prisma.post.updateMany({
    where: {
      id: { in: postIds },
      workspaceId,
      status: { in: ["DRAFT", "SCHEDULED"] },
    },
    data: { status: "SCHEDULED", scheduledAt },
  });

  await logActivity({
    workspaceId,
    userId: session.user.id,
    action: "bulk_reschedule",
    details: `Rescheduled ${count} posts`,
  });

  return { success: true, count };
}
