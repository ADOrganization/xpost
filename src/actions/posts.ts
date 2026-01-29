"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MAX_THREAD_ITEMS,
  MAX_IMAGES_PER_TWEET,
  MAX_POLL_OPTIONS,
  POLL_OPTION_CHAR_LIMIT,
  TWEET_CHAR_LIMIT,
} from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

// ─── Zod Schemas ───

const imageSchema = z.object({
  url: z.string().url(),
  altText: z.string().max(1000).optional().default(""),
});

const threadItemSchema = z.object({
  text: z.string().min(1).max(TWEET_CHAR_LIMIT),
  imageUrls: z.array(imageSchema).max(MAX_IMAGES_PER_TWEET).optional().default([]),
});

const createPostSchema = z
  .object({
    workspaceId: z.string().min(1),
    xAccountId: z.string().min(1).optional(),
    items: z.array(threadItemSchema).min(1).max(MAX_THREAD_ITEMS),
    pollOptions: z
      .array(z.string().min(1).max(POLL_OPTION_CHAR_LIMIT))
      .min(2)
      .max(MAX_POLL_OPTIONS)
      .optional(),
    scheduledAt: z.coerce.date().optional(),
    status: z.enum(["DRAFT", "SCHEDULED"]),
  })
  .refine(
    (data) => {
      if (data.status === "SCHEDULED") {
        return !!data.xAccountId && !!data.scheduledAt;
      }
      return true;
    },
    {
      message: "Scheduled posts require an X account and scheduled time",
    }
  );

const rescheduleSchema = z.object({
  postId: z.string().min(1),
  scheduledAt: z.coerce.date(),
});

// ─── Types ───

type ActionResult = {
  success: boolean;
  error?: string;
  postId?: string;
};

// ─── Helpers ───

async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function checkWorkspaceAccess(
  userId: string,
  workspaceId: string,
  requiredRoles: ("OWNER" | "EDITOR")[] = ["OWNER", "EDITOR"]
): Promise<boolean> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  if (!membership) return false;
  return requiredRoles.includes(membership.role as "OWNER" | "EDITOR");
}

// ─── Server Actions ───

export async function createPost(formData: {
  workspaceId: string;
  xAccountId?: string;
  items: { text: string; imageUrls?: { url: string; altText?: string }[] }[];
  pollOptions?: string[];
  scheduledAt?: Date | string;
  status: "DRAFT" | "SCHEDULED";
}): Promise<ActionResult> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const { success: withinLimit } = rateLimit(`create-post:${userId}`, 30, 60 * 1000);
    if (!withinLimit) {
      return { success: false, error: "Rate limited. You are creating posts too quickly. Please try again shortly." };
    }

    const parsed = createPostSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
    }

    const { workspaceId, xAccountId, items, pollOptions, scheduledAt, status } =
      parsed.data;

    const hasAccess = await checkWorkspaceAccess(userId, workspaceId);
    if (!hasAccess) {
      return { success: false, error: "You do not have permission to create posts in this workspace" };
    }

    // If xAccountId is provided, verify it belongs to the workspace
    if (xAccountId) {
      const xAccount = await prisma.xAccount.findFirst({
        where: { id: xAccountId, workspaceId },
      });
      if (!xAccount) {
        return { success: false, error: "X account not found in this workspace" };
      }
    }

    const post = await prisma.post.create({
      data: {
        workspaceId,
        xAccountId: xAccountId ?? null,
        status,
        scheduledAt: scheduledAt ?? null,
        threadItems: {
          create: items.map((item, index) => ({
            position: index,
            text: item.text,
            images: {
              create: (item.imageUrls ?? []).map((img, imgIndex) => ({
                url: img.url,
                altText: img.altText || null,
                position: imgIndex,
              })),
            },
            ...(index === 0 && pollOptions && pollOptions.length >= 2
              ? {
                  pollOptions: {
                    create: pollOptions.map((label, optIndex) => ({
                      label,
                      position: optIndex,
                    })),
                  },
                }
              : {}),
          })),
        },
      },
    });

    return { success: true, postId: post.id };
  } catch (error) {
    console.error("createPost error:", error);
    return { success: false, error: "Failed to create post" };
  }
}

export async function updatePost(
  postId: string,
  formData: {
    workspaceId: string;
    xAccountId?: string;
    items: { text: string; imageUrls?: { url: string; altText?: string }[] }[];
    pollOptions?: string[];
    scheduledAt?: Date | string;
    status: "DRAFT" | "SCHEDULED";
  }
): Promise<ActionResult> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = createPostSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
    }

    const { workspaceId, xAccountId, items, pollOptions, scheduledAt, status } =
      parsed.data;

    // Check workspace access
    const hasAccess = await checkWorkspaceAccess(userId, workspaceId);
    if (!hasAccess) {
      return { success: false, error: "You do not have permission to edit posts in this workspace" };
    }

    // Fetch existing post
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return { success: false, error: "Post not found" };
    }

    if (existingPost.workspaceId !== workspaceId) {
      return { success: false, error: "Post does not belong to this workspace" };
    }

    // Only DRAFT or FAILED posts can be updated
    if (existingPost.status !== "DRAFT" && existingPost.status !== "FAILED") {
      return {
        success: false,
        error: `Cannot update a post with status "${existingPost.status}". Only DRAFT or FAILED posts can be edited.`,
      };
    }

    // If xAccountId is provided, verify it belongs to the workspace
    if (xAccountId) {
      const xAccount = await prisma.xAccount.findFirst({
        where: { id: xAccountId, workspaceId },
      });
      if (!xAccount) {
        return { success: false, error: "X account not found in this workspace" };
      }
    }

    // Delete old thread items (cascade deletes images and poll options)
    await prisma.threadItem.deleteMany({
      where: { postId },
    });

    // Update post and recreate thread items
    await prisma.post.update({
      where: { id: postId },
      data: {
        xAccountId: xAccountId ?? null,
        status,
        scheduledAt: scheduledAt ?? null,
        error: null, // Clear previous error on update
        retryCount: 0, // Reset retry count
        threadItems: {
          create: items.map((item, index) => ({
            position: index,
            text: item.text,
            images: {
              create: (item.imageUrls ?? []).map((img, imgIndex) => ({
                url: img.url,
                altText: img.altText || null,
                position: imgIndex,
              })),
            },
            ...(index === 0 && pollOptions && pollOptions.length >= 2
              ? {
                  pollOptions: {
                    create: pollOptions.map((label, optIndex) => ({
                      label,
                      position: optIndex,
                    })),
                  },
                }
              : {}),
          })),
        },
      },
    });

    return { success: true, postId };
  } catch (error) {
    console.error("updatePost error:", error);
    return { success: false, error: "Failed to update post" };
  }
}

export async function deletePost(postId: string): Promise<ActionResult> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    // Check workspace access
    const hasAccess = await checkWorkspaceAccess(userId, post.workspaceId);
    if (!hasAccess) {
      return { success: false, error: "You do not have permission to delete posts in this workspace" };
    }

    // Only DRAFT, SCHEDULED, or FAILED posts can be deleted
    const deletableStatuses = ["DRAFT", "SCHEDULED", "FAILED"];
    if (!deletableStatuses.includes(post.status)) {
      return {
        success: false,
        error: `Cannot delete a post with status "${post.status}". Only DRAFT, SCHEDULED, or FAILED posts can be deleted.`,
      };
    }

    // Delete post (cascades to threadItems, images, pollOptions)
    await prisma.post.delete({
      where: { id: postId },
    });

    return { success: true, postId };
  } catch (error) {
    console.error("deletePost error:", error);
    return { success: false, error: "Failed to delete post" };
  }
}

export async function reschedulePost(
  postId: string,
  scheduledAt: Date | string
): Promise<ActionResult> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = rescheduleSchema.safeParse({ postId, scheduledAt });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    // Check workspace access
    const hasAccess = await checkWorkspaceAccess(userId, post.workspaceId);
    if (!hasAccess) {
      return { success: false, error: "You do not have permission to reschedule posts in this workspace" };
    }

    // Only SCHEDULED posts can be rescheduled
    if (post.status !== "SCHEDULED") {
      return {
        success: false,
        error: `Cannot reschedule a post with status "${post.status}". Only SCHEDULED posts can be rescheduled.`,
      };
    }

    await prisma.post.update({
      where: { id: postId },
      data: { scheduledAt: parsed.data.scheduledAt },
    });

    return { success: true, postId };
  } catch (error) {
    console.error("reschedulePost error:", error);
    return { success: false, error: "Failed to reschedule post" };
  }
}

export async function publishNow(postId: string): Promise<ActionResult> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    // Check workspace access
    const hasAccess = await checkWorkspaceAccess(userId, post.workspaceId);
    if (!hasAccess) {
      return { success: false, error: "You do not have permission to publish posts in this workspace" };
    }

    // Only DRAFT or SCHEDULED posts can be published immediately
    if (post.status !== "DRAFT" && post.status !== "SCHEDULED") {
      return {
        success: false,
        error: `Cannot publish a post with status "${post.status}". Only DRAFT or SCHEDULED posts can be published.`,
      };
    }

    // Must have an X account assigned
    if (!post.xAccountId) {
      return {
        success: false,
        error: "Cannot publish without an X account. Please assign an X account first.",
      };
    }

    // Set to SCHEDULED with scheduledAt = now so the cron picks it up
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "SCHEDULED",
        scheduledAt: new Date(),
      },
    });

    return { success: true, postId };
  } catch (error) {
    console.error("publishNow error:", error);
    return { success: false, error: "Failed to publish post" };
  }
}
