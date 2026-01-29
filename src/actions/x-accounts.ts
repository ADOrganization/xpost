"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function disconnectXAccount(
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Find the X account to verify it exists
    const xAccount = await prisma.xAccount.findUnique({
      where: { id: accountId },
    });

    if (!xAccount) {
      return { success: false, error: "X account not found" };
    }

    // Verify the user has access to the workspace that owns this account
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: xAccount.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return {
        success: false,
        error: "You do not have access to this workspace",
      };
    }

    // Only OWNER and EDITOR roles can disconnect accounts
    if (membership.role !== "OWNER" && membership.role !== "EDITOR") {
      return {
        success: false,
        error: "You do not have permission to disconnect accounts",
      };
    }

    // Delete the X account
    await prisma.xAccount.delete({
      where: { id: accountId },
    });

    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error) {
    console.error("disconnectXAccount error:", error);
    return { success: false, error: "Failed to disconnect account" };
  }
}
