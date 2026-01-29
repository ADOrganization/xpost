import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Fetch published posts with analytics
    const posts = await prisma.post.findMany({
      where: { workspaceId, status: "PUBLISHED" },
      include: {
        analytics: true,
        threadItems: {
          orderBy: { position: "asc" },
          take: 1,
          select: { text: true, tweetId: true },
        },
        xAccount: {
          select: { username: true, displayName: true },
        },
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });

    // Aggregate metrics
    const totals = posts.reduce(
      (acc, post) => {
        if (post.analytics) {
          acc.impressions += post.analytics.impressions;
          acc.likes += post.analytics.likes;
          acc.retweets += post.analytics.retweets;
          acc.replies += post.analytics.replies;
          acc.quotes += post.analytics.quotes;
          acc.bookmarks += post.analytics.bookmarks;
        }
        return acc;
      },
      { impressions: 0, likes: 0, retweets: 0, replies: 0, quotes: 0, bookmarks: 0 }
    );

    const engagements = totals.likes + totals.retweets + totals.replies + totals.quotes;
    const engagementRate = totals.impressions > 0
      ? (engagements / totals.impressions) * 100
      : 0;

    return NextResponse.json({
      totals,
      engagementRate,
      posts: posts.map((p) => ({
        id: p.id,
        postText: p.threadItems[0]?.text ?? "",
        postId: p.threadItems[0]?.tweetId ?? p.id,
        tweetId: p.threadItems[0]?.tweetId,
        publishedAt: p.publishedAt,
        account: p.xAccount,
        impressions: p.analytics?.impressions ?? 0,
        likes: p.analytics?.likes ?? 0,
        retweets: p.analytics?.retweets ?? 0,
        replies: p.analytics?.replies ?? 0,
        analytics: p.analytics,
      })),
    });
  } catch {
    return NextResponse.json({
      totals: { impressions: 0, likes: 0, retweets: 0, replies: 0, quotes: 0, bookmarks: 0 },
      engagementRate: 0,
      posts: [],
    });
  }
}
