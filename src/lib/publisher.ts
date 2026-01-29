import { TwitterApi } from "twitter-api-v2";
import { prisma } from "@/lib/prisma";
import { getTwitterClient } from "@/lib/twitter";
import { PUBLISH_BATCH_SIZE, MAX_RETRY_COUNT } from "@/lib/constants";
import type { Post, ThreadItem, PostImage, PollOption, XAccount } from "@prisma/client";

// ─── Types ───

type ThreadItemWithRelations = ThreadItem & {
  images: PostImage[];
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

/**
 * Main publishing engine called by the cron job.
 * Atomically locks scheduled posts, publishes them, and updates their status.
 */
export async function publishScheduledPosts(): Promise<PublishResult> {
  const result: PublishResult = {
    processed: 0,
    published: 0,
    failed: 0,
    retried: 0,
  };

  try {
    // Step 1: Atomic lock — transition SCHEDULED posts to PUBLISHING
    const { count: lockedCount } = await prisma.post.updateMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          lte: new Date(),
        },
        xAccountId: {
          not: null,
        },
      },
      data: {
        status: "PUBLISHING",
      },
    });

    if (lockedCount === 0) {
      return result;
    }

    // Step 2: Fetch all PUBLISHING posts with relations
    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHING",
      },
      include: {
        threadItems: {
          orderBy: { position: "asc" },
          include: {
            images: {
              orderBy: { position: "asc" },
            },
            pollOptions: {
              orderBy: { position: "asc" },
            },
          },
        },
        xAccount: true,
      },
      take: PUBLISH_BATCH_SIZE,
    });

    result.processed = posts.length;

    // Step 3: Publish each post independently (one failure doesn't stop others)
    for (const post of posts) {
      try {
        if (!post.xAccount) {
          throw new Error("Post has no associated X account");
        }

        const tweetIds = await publishSinglePost(post as PostWithRelations);

        // Step 4a: Success — mark as PUBLISHED and store tweet IDs
        await prisma.$transaction(async (tx) => {
          // Update each thread item with its tweet ID
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
            data: {
              status: "PUBLISHED",
              publishedAt: new Date(),
              error: null,
            },
          });
        });

        result.published++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown publishing error";

        console.error(`Failed to publish post ${post.id}:`, errorMessage);

        const newRetryCount = post.retryCount + 1;

        if (newRetryCount >= MAX_RETRY_COUNT) {
          // Step 4b: Max retries exceeded — mark as FAILED
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: "FAILED",
              error: errorMessage,
              retryCount: newRetryCount,
            },
          });
          result.failed++;
        } else {
          // Step 4c: Retry — set back to SCHEDULED for next cycle
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: "SCHEDULED",
              error: errorMessage,
              retryCount: newRetryCount,
            },
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

// ─── Single Post Publisher ───

/**
 * Publishes a single post (or thread) to X/Twitter.
 * Returns an array of tweet IDs corresponding to each thread item.
 */
async function publishSinglePost(post: PostWithRelations): Promise<string[]> {
  const client = await getTwitterClient(post.xAccountId!);
  const tweetIds: string[] = [];

  for (let i = 0; i < post.threadItems.length; i++) {
    const item = post.threadItems[i];
    const isFirstTweet = i === 0;
    const previousTweetId = i > 0 ? tweetIds[i - 1] : undefined;

    // Upload media if images are present
    const mediaIds: string[] = [];
    if (item.images.length > 0) {
      for (const image of item.images) {
        const mediaId = await downloadAndUploadMedia(client, image.url);
        mediaIds.push(mediaId);
      }
    }

    // Build tweet payload
    const tweetPayload: Parameters<typeof client.v2.tweet>[0] = {
      text: item.text,
    };

    // Attach media (X API v2 supports 1-4 media per tweet)
    if (mediaIds.length > 0) {
      tweetPayload.media = {
        media_ids: mediaIds as
          | [string]
          | [string, string]
          | [string, string, string]
          | [string, string, string, string],
      };
    }

    // Attach poll (only on the first tweet)
    if (isFirstTweet && item.pollOptions.length >= 2) {
      tweetPayload.poll = {
        options: item.pollOptions.map((opt) => opt.label),
        duration_minutes: 1440, // 24 hours default
      };
    }

    // Reply to previous tweet in thread
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

/**
 * Downloads an image from a URL (e.g. Vercel Blob) and uploads it to X/Twitter.
 * Returns the media ID string.
 */
async function downloadAndUploadMedia(
  client: TwitterApi,
  imageUrl: string
): Promise<string> {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to download image from ${imageUrl}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Determine MIME type from response headers or URL
  const contentType = response.headers.get("content-type") ?? inferMimeType(imageUrl);

  const mediaId = await client.v1.uploadMedia(buffer, {
    mimeType: contentType,
  });

  return mediaId;
}

/**
 * Infers MIME type from file URL extension as a fallback.
 */
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
    default:
      return "image/jpeg"; // Safe default for X
  }
}
