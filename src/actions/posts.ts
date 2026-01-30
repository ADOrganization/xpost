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
import { publishPostById } from "@/lib/publisher";
import { logActivity } from "@/lib/activity";

// ─── Zod Schemas ───

const mediaSchema = z.object({
  url: z.string().url(),
  altText: z.string().max(1000).optional().default(""),
  mediaType: z.enum(["IMAGE", "VIDEO", "GIF"]).optional().default("IMAGE"),
});

const threadItemSchema = z.object({
  text: z.string().min(1),
  imageUrls: z.array(mediaSchema).max(MAX_IMAGES_PER_TWEET).optional().default([]),
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
    pollDuration: z.number().int().min(5).max(10080).optional(),
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
  )
  .refine(
    (data) => {
      if (data.status !== "DRAFT") {
        return data.items.every((item) => item.text.length <= TWEET_CHAR_LIMIT);
      }
      return true;
    },
    {
      message: `Each tweet must be ${TWEET_CHAR_LIMIT} characters or fewer to publish`,
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
  items: { text: string; imageUrls?: { url: string; altText?: string; mediaType?: string }[] }[];
  pollOptions?: string[];
  pollDuration?: number;
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

    const { workspaceId, xAccountId, items, pollOptions, pollDuration, scheduledAt, status } =
      parsed.data;

    const hasAccess = await checkWorkspaceAccess(userId, workspaceId);
    if (!hasAccess) {
      return { success: false, error: "You do not have permission to create posts in this workspace" };
    }

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
        pollDuration: pollOptions && pollOptions.length >= 2 ? (pollDuration ?? 1440) : null,
        threadItems: {
          create: items.map((item, index) => ({
            position: index,
            text: item.text,
            media: {
              create: (item.imageUrls ?? []).map((img, imgIndex) => ({
                url: img.url,
                altText: img.altText || null,
                position: imgIndex,
                mediaType: (img.mediaType as "IMAGE" | "VIDEO" | "GIF") || "IMAGE",
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

    await logActivity({
      workspaceId,
      userId,
      action: status === "DRAFT" ? "post_drafted" : "post_scheduled",
      postId: post.id,
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
    items: { text: string; imageUrls?: { url: string; altText?: string; mediaType?: string }[] }[];
    pollOptions?: string[];
    pollDuration?: number;
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

    const { workspaceId, xAccountId, items, pollOptions, pollDuration, scheduledAt, status } =
      parsed.data;

    const hasAccess = await checkWorkspaceAccess(userId, workspaceId);
    if (!hasAccess) {
      return { success: false, error: "You do not have permission to edit posts in this workspace" };
    }

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return { success: false, error: "Post not found" };
    }

    if (existingPost.workspaceId !== workspaceId) {
      return { success: false, error: "Post does not belong to this workspace" };
    }

    if (!["DRAFT", "FAILED", "IN_REVIEW"].includes(existingPost.status)) {
      return {
        success: false,
        error: `Cannot update a post with status "${existingPost.status}".`,
      };
    }

    if (xAccountId) {
      const xAccount = await prisma.xAccount.findFirst({
        where: { id: xAccountId, workspaceId },
      });
      if (!xAccount) {
        return { success: false, error: "X account not found in this workspace" };
      }
    }

    await prisma.threadItem.deleteMany({ where: { postId } });

    await prisma.post.update({
      where: { id: postId },
      data: {
        xAccountId: xAccountId ?? null,
        status,
        scheduledAt: scheduledAt ?? null,
        pollDuration: pollOptions && pollOptions.length >= 2 ? (pollDuration ?? 1440) : null,
        error: null,
        retryCount: 0,
        threadItems: {
          create: items.map((item, index) => ({
            position: index,
            text: item.text,
            media: {
              create: (item.imageUrls ?? []).map((img, imgIndex) => ({
                url: img.url,
                altText: img.altText || null,
                position: imgIndex,
                mediaType: (img.mediaType as "IMAGE" | "VIDEO" | "GIF") || "IMAGE",
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

    await logActivity({
      workspaceId,
      userId,
      action: "post_updated",
      postId,
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

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return { success: false, error: "Post not found" };

    const hasAccess = await checkWorkspaceAccess(userId, post.workspaceId);
    if (!hasAccess) {
      return { success: false, error: "You do not have permission to delete posts in this workspace" };
    }

    const deletableStatuses = ["DRAFT", "SCHEDULED", "FAILED", "IN_REVIEW"];
    if (!deletableStatuses.includes(post.status)) {
      return {
        success: false,
        error: `Cannot delete a post with status "${post.status}".`,
      };
    }

    await prisma.post.delete({ where: { id: postId } });

    await logActivity({
      workspaceId: post.workspaceId,
      userId,
      action: "post_deleted",
      postId,
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

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return { success: false, error: "Post not found" };

    const hasAccess = await checkWorkspaceAccess(userId, post.workspaceId);
    if (!hasAccess) {
      return { success: false, error: "You do not have permission to reschedule posts" };
    }

    if (post.status !== "SCHEDULED") {
      return {
        success: false,
        error: `Cannot reschedule a post with status "${post.status}".`,
      };
    }

    if (parsed.data.scheduledAt < new Date()) {
      return { success: false, error: "Cannot schedule a post in the past" };
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

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return { success: false, error: "Post not found" };

    const hasAccess = await checkWorkspaceAccess(userId, post.workspaceId);
    if (!hasAccess) {
      return { success: false, error: "You do not have permission to publish posts" };
    }

    if (post.status !== "DRAFT" && post.status !== "SCHEDULED") {
      return {
        success: false,
        error: `Cannot publish a post with status "${post.status}".`,
      };
    }

    if (!post.xAccountId) {
      return {
        success: false,
        error: "Cannot publish without an X account.",
      };
    }

    try {
      await publishPostById(postId);
    } catch {
      return { success: false, error: "Failed to publish to X. Check the Failed tab." };
    }

    await logActivity({
      workspaceId: post.workspaceId,
      userId,
      action: "post_published",
      postId,
    });

    return { success: true, postId };
  } catch (error) {
    console.error("publishNow error:", error);
    return { success: false, error: "Failed to publish post" };
  }
}

export async function createAndPublishNow(formData: {
  workspaceId: string;
  xAccountId: string;
  items: { text: string; imageUrls?: { url: string; altText?: string; mediaType?: string }[] }[];
  pollOptions?: string[];
  pollDuration?: number;
}): Promise<ActionResult> {
  const result = await createPost({
    ...formData,
    scheduledAt: new Date(),
    status: "SCHEDULED",
  });

  if (!result.success || !result.postId) return result;

  try {
    await publishPostById(result.postId);
    return { success: true, postId: result.postId };
  } catch {
    return {
      success: false,
      postId: result.postId,
      error: "Post created but failed to publish. Check the Failed tab.",
    };
  }
}
