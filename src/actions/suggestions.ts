"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function acceptSuggestion(suggestionId: string) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false as const, error: "Not authenticated" };
  }

  const suggestion = await prisma.shareSuggestion.findUnique({
    where: { id: suggestionId },
    include: {
      shareLink: {
        include: {
          post: { select: { id: true, workspaceId: true } },
        },
      },
    },
  });

  if (!suggestion) {
    return { success: false as const, error: "Suggestion not found" };
  }

  if (suggestion.status !== "PENDING") {
    return { success: false as const, error: "Suggestion already resolved" };
  }

  // Verify the user is a member of the workspace
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: suggestion.shareLink.post.workspaceId,
        userId,
      },
    },
  });

  if (!membership) {
    return { success: false as const, error: "Not a member of this workspace" };
  }

  // Update the thread item text and mark suggestion as accepted
  const postId = suggestion.shareLink.post.id;

  await prisma.$transaction([
    prisma.threadItem.update({
      where: {
        postId_position: {
          postId,
          position: suggestion.threadItemPosition,
        },
      },
      data: { text: suggestion.suggestedText },
    }),
    prisma.shareSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: "ACCEPTED",
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
    }),
  ]);

  return { success: true as const };
}

export async function rejectSuggestion(suggestionId: string) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false as const, error: "Not authenticated" };
  }

  const suggestion = await prisma.shareSuggestion.findUnique({
    where: { id: suggestionId },
    include: {
      shareLink: {
        include: {
          post: { select: { workspaceId: true } },
        },
      },
    },
  });

  if (!suggestion) {
    return { success: false as const, error: "Suggestion not found" };
  }

  if (suggestion.status !== "PENDING") {
    return { success: false as const, error: "Suggestion already resolved" };
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: suggestion.shareLink.post.workspaceId,
        userId,
      },
    },
  });

  if (!membership) {
    return { success: false as const, error: "Not a member of this workspace" };
  }

  await prisma.shareSuggestion.update({
    where: { id: suggestionId },
    data: {
      status: "REJECTED",
      resolvedAt: new Date(),
      resolvedBy: userId,
    },
  });

  return { success: true as const };
}
