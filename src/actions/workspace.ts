"use server";

import { z } from "zod";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Zod Schemas ───

const createInviteSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  role: z.enum(["EDITOR", "VIEWER"], {
    error: "Role must be EDITOR or VIEWER",
  }),
});

const acceptInviteSchema = z.object({
  code: z.string().min(1, "Invite code is required"),
});

const changeMemberRoleSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"], {
    error: "Invalid role",
  }),
});

const removeMemberSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
});

const updateWorkspaceNameSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or fewer"),
});

// ─── Types ───

type ActionResult = {
  success: boolean;
  error?: string;
  code?: string;
  workspaceId?: string;
};

// ─── Helpers ───

async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function verifyOwnerRole(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  return membership?.role === "OWNER";
}

// ─── Server Actions ───

export async function createInvite(
  workspaceId: string,
  role: "EDITOR" | "VIEWER"
): Promise<ActionResult> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = createInviteSchema.safeParse({ workspaceId, role });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const isOwner = await verifyOwnerRole(userId, parsed.data.workspaceId);
    if (!isOwner) {
      return {
        success: false,
        error: "Only workspace owners can create invites",
      };
    }

    const code = nanoid(12);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.workspaceInvite.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        code,
        role: parsed.data.role,
        expiresAt,
      },
    });

    return { success: true, code };
  } catch (error) {
    console.error("createInvite error:", error);
    return { success: false, error: "Failed to create invite" };
  }
}

export async function acceptInvite(code: string): Promise<ActionResult> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = acceptInviteSchema.safeParse({ code });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const invite = await prisma.workspaceInvite.findUnique({
      where: { code: parsed.data.code },
    });

    if (!invite) {
      return { success: false, error: "Invite not found" };
    }

    if (invite.expiresAt < new Date()) {
      return { success: false, error: "This invite has expired" };
    }

    // Check if user is already a member of this workspace
    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId,
        },
      },
    });

    if (existingMembership) {
      return {
        success: false,
        error: "You are already a member of this workspace",
      };
    }

    await prisma.workspaceMember.create({
      data: {
        workspaceId: invite.workspaceId,
        userId,
        role: invite.role,
      },
    });

    return { success: true, workspaceId: invite.workspaceId };
  } catch (error) {
    console.error("acceptInvite error:", error);
    return { success: false, error: "Failed to accept invite" };
  }
}

export async function changeMemberRole(
  memberId: string,
  role: "OWNER" | "EDITOR" | "VIEWER"
): Promise<ActionResult> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = changeMemberRoleSchema.safeParse({ memberId, role });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    // Find the target member
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: parsed.data.memberId },
    });

    if (!targetMember) {
      return { success: false, error: "Member not found" };
    }

    // Verify the current user is an OWNER of the same workspace
    const isOwner = await verifyOwnerRole(userId, targetMember.workspaceId);
    if (!isOwner) {
      return {
        success: false,
        error: "Only workspace owners can change member roles",
      };
    }

    // Prevent OWNER from changing their own role
    if (targetMember.userId === userId) {
      return {
        success: false,
        error: "You cannot change your own role",
      };
    }

    await prisma.workspaceMember.update({
      where: { id: parsed.data.memberId },
      data: { role: parsed.data.role },
    });

    revalidatePath("/dashboard/team");

    return { success: true };
  } catch (error) {
    console.error("changeMemberRole error:", error);
    return { success: false, error: "Failed to change member role" };
  }
}

export async function updateWorkspaceName(
  workspaceId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = updateWorkspaceNameSchema.safeParse({ workspaceId, name });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const isOwner = await verifyOwnerRole(userId, parsed.data.workspaceId);
    if (!isOwner) {
      return {
        success: false,
        error: "Only workspace owners can rename the workspace",
      };
    }

    await prisma.workspace.update({
      where: { id: parsed.data.workspaceId },
      data: { name: parsed.data.name },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("updateWorkspaceName error:", error);
    return { success: false, error: "Failed to update workspace name" };
  }
}

export async function removeMember(memberId: string): Promise<ActionResult> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = removeMemberSchema.safeParse({ memberId });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    // Find the target member
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: parsed.data.memberId },
    });

    if (!targetMember) {
      return { success: false, error: "Member not found" };
    }

    // Verify the current user is an OWNER of the same workspace
    const isOwner = await verifyOwnerRole(userId, targetMember.workspaceId);
    if (!isOwner) {
      return {
        success: false,
        error: "Only workspace owners can remove members",
      };
    }

    // Prevent OWNER from removing themselves
    if (targetMember.userId === userId) {
      return {
        success: false,
        error: "You cannot remove yourself from the workspace",
      };
    }

    await prisma.workspaceMember.delete({
      where: { id: parsed.data.memberId },
    });

    revalidatePath("/dashboard/team");

    return { success: true };
  } catch (error) {
    console.error("removeMember error:", error);
    return { success: false, error: "Failed to remove member" };
  }
}
