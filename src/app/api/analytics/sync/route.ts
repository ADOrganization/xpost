import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchTweetMetrics } from "@/lib/socialdata";

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get published posts that have tweetIds and need metrics sync
    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        threadItems: {
          some: { tweetId: { not: null } },
        },
      },
      include: {
        threadItems: {
          where: { position: 0 },
          select: { tweetId: true },
        },
        analytics: {
          select: { fetchedAt: true },
        },
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });

    let synced = 0;

    for (const post of posts) {
      const tweetId = post.threadItems[0]?.tweetId;
      if (!tweetId) continue;

      // Skip if synced within last hour
      if (post.analytics?.fetchedAt) {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (post.analytics.fetchedAt > hourAgo) continue;
      }

      const metrics = await fetchTweetMetrics(tweetId);
      if (!metrics) continue;

      await prisma.postAnalytics.upsert({
        where: { postId: post.id },
        create: {
          postId: post.id,
          impressions: metrics.impressions,
          likes: metrics.likes,
          retweets: metrics.retweets,
          replies: metrics.replies,
          quotes: metrics.quotes,
          bookmarks: metrics.bookmarks,
        },
        update: {
          impressions: metrics.impressions,
          likes: metrics.likes,
          retweets: metrics.retweets,
          replies: metrics.replies,
          quotes: metrics.quotes,
          bookmarks: metrics.bookmarks,
          fetchedAt: new Date(),
        },
      });

      synced++;
    }

    return NextResponse.json({ synced });
  } catch (error) {
    console.error("Analytics sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
