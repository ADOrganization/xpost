import { TwitterApi, ApiResponseError } from "twitter-api-v2";
import { prisma } from "@/lib/prisma";
import { getTwitterClient } from "@/lib/twitter";
import { PUBLISH_BATCH_SIZE, MAX_RETRY_COUNT } from "@/lib/constants";
import type { Post, ThreadItem, PostMedia, PollOption, XAccount } from "@prisma/client";

/** Extract a detailed error message from X API errors */
function extractXApiError(error: unknown): string {
  if (error instanceof ApiResponseError) {
    const details = error.data
      ? JSON.stringify(error.data)
      : error.message;
    return `X API ${error.code}: ${details}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown publishing error";
}

// ─── Types ───

type ThreadItemWithRelations = ThreadItem & {
  media: PostMedia[];
  pollOptions: PollOption[];
};

type PostWithRelations = Post & {
  threadItems: ThreadItemWithRelations[];
  xAccount: XAccount | null;
};

type PublishResult = {
  processed: number;
  published: number;
  failed: number;
  retried: number;
};

// ─── Main Entry Point ───

export async function publishScheduledPosts(): Promise<PublishResult> {
  const result: PublishResult = {
    processed: 0,
    published: 0,
    failed: 0,
    retried: 0,
  };

  try {
    const { count: lockedCount } = await prisma.post.updateMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: new Date() },
        xAccountId: { not: null },
      },
      data: { status: "PUBLISHING" },
    });

    if (lockedCount === 0) return result;

    const posts = await prisma.post.findMany({
      where: { status: "PUBLISHING" },
      include: {
        threadItems: {
          orderBy: { position: "asc" },
          include: {
            media: { orderBy: { position: "asc" } },
            pollOptions: { orderBy: { position: "asc" } },
          },
        },
        xAccount: true,
      },
      take: PUBLISH_BATCH_SIZE,
    });

    result.processed = posts.length;

    for (const post of posts) {
      try {
        if (!post.xAccount) throw new Error("Post has no associated X account");

        const tweetIds = await publishSinglePost(post as PostWithRelations);

        await prisma.$transaction(async (tx) => {
          for (let i = 0; i < tweetIds.length; i++) {
            if (post.threadItems[i] && tweetIds[i]) {
              await tx.threadItem.update({
                where: { id: post.threadItems[i].id },
                data: { tweetId: tweetIds[i] },
              });
            }
          }
          await tx.post.update({
            where: { id: post.id },
            data: { status: "PUBLISHED", publishedAt: new Date(), error: null },
          });
        });

        result.published++;
      } catch (error) {
        const errorMessage = extractXApiError(error);
        console.error(`Failed to publish post ${post.id}:`, errorMessage);
        const newRetryCount = post.retryCount + 1;

        if (newRetryCount >= MAX_RETRY_COUNT) {
          await prisma.post.update({
            where: { id: post.id },
            data: { status: "FAILED", error: errorMessage, retryCount: newRetryCount },
          });
          result.failed++;
        } else {
          await prisma.post.update({
            where: { id: post.id },
            data: { status: "SCHEDULED", error: errorMessage, retryCount: newRetryCount },
          });
          result.retried++;
        }
      }
    }
  } catch (error) {
    console.error("publishScheduledPosts fatal error:", error);
  }

  return result;
}

// ─── Immediate Publish ───

export async function publishPostById(postId: string): Promise<void> {
  const post = await prisma.post.update({
    where: { id: postId },
    data: { status: "PUBLISHING" },
    include: {
      threadItems: {
        orderBy: { position: "asc" },
        include: {
          media: { orderBy: { position: "asc" } },
          pollOptions: { orderBy: { position: "asc" } },
        },
      },
      xAccount: true,
    },
  });

  if (!post.xAccount) {
    await prisma.post.update({
      where: { id: postId },
      data: { status: "FAILED", error: "No X account assigned" },
    });
    throw new Error("Post has no associated X account");
  }

  try {
    const tweetIds = await publishSinglePost(post as PostWithRelations);

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < tweetIds.length; i++) {
        if (post.threadItems[i] && tweetIds[i]) {
          await tx.threadItem.update({
            where: { id: post.threadItems[i].id },
            data: { tweetId: tweetIds[i] },
          });
        }
      }
      await tx.post.update({
        where: { id: postId },
        data: { status: "PUBLISHED", publishedAt: new Date(), error: null },
      });
    });
  } catch (error) {
    const errorMessage = extractXApiError(error);
    await prisma.post.update({
      where: { id: postId },
      data: { status: "FAILED", error: errorMessage },
    });
    throw new Error(errorMessage);
  }
}

// ─── Single Post Publisher ───

async function publishSinglePost(post: PostWithRelations): Promise<string[]> {
  const client = await getTwitterClient(post.xAccountId!);
  const tweetIds: string[] = [];

  for (let i = 0; i < post.threadItems.length; i++) {
    const item = post.threadItems[i];
    const isFirstTweet = i === 0;
    const previousTweetId = i > 0 ? tweetIds[i - 1] : undefined;

    // Upload media
    const mediaIds: string[] = [];
    if (item.media.length > 0) {
      for (const mediaItem of item.media) {
        const mediaId = await downloadAndUploadMedia(
          client,
          mediaItem.url,
          mediaItem.mediaType
        );
        mediaIds.push(mediaId);
      }
    }

    const tweetPayload: Parameters<typeof client.v2.tweet>[0] = {
      text: item.text,
    };

    if (mediaIds.length > 0) {
      tweetPayload.media = {
        media_ids: mediaIds as
          | [string]
          | [string, string]
          | [string, string, string]
          | [string, string, string, string],
      };
    }

    if (isFirstTweet && item.pollOptions.length >= 2) {
      tweetPayload.poll = {
        options: item.pollOptions.map((opt) => opt.label),
        duration_minutes: post.pollDuration ?? 1440,
      };
    }

    if (previousTweetId) {
      tweetPayload.reply = {
        in_reply_to_tweet_id: previousTweetId,
      };
    }

    const { data } = await client.v2.tweet(tweetPayload);
    tweetIds.push(data.id);
  }

  return tweetIds;
}

// ─── Media Upload Helper ───

async function downloadAndUploadMedia(
  client: TwitterApi,
  mediaUrl: string,
  mediaType: string = "IMAGE"
): Promise<string> {
  const response = await fetch(mediaUrl);

  if (!response.ok) {
    throw new Error(`Failed to download media from ${mediaUrl}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") ?? inferMimeType(mediaUrl);

  if (mediaType === "VIDEO") {
    // Use chunked upload for videos
    const mediaId = await client.v1.uploadMedia(buffer, {
      mimeType: contentType,
      additionalOwners: [],
      target: "tweet",
      shared: false,
    });
    return mediaId;
  }

  const mediaId = await client.v1.uploadMedia(buffer, {
    mimeType: contentType,
  });

  return mediaId;
}

function inferMimeType(url: string): string {
  const extension = url.split(".").pop()?.toLowerCase().split("?")[0];

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    default:
      return "image/jpeg";
  }
}
