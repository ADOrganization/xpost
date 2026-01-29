const SOCIALDATA_API_KEY = process.env.SOCIALDATA_API_KEY;
const SOCIALDATA_BASE_URL = "https://api.socialdata.tools";

export interface TweetMetrics {
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  bookmarks: number;
}

export async function fetchTweetMetrics(tweetId: string): Promise<TweetMetrics | null> {
  if (!SOCIALDATA_API_KEY) return null;

  try {
    const res = await fetch(`${SOCIALDATA_BASE_URL}/twitter/tweets/${tweetId}`, {
      headers: {
        Authorization: `Bearer ${SOCIALDATA_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      impressions: data.views_count ?? 0,
      likes: data.favorite_count ?? 0,
      retweets: data.retweet_count ?? 0,
      replies: data.reply_count ?? 0,
      quotes: data.quote_count ?? 0,
      bookmarks: data.bookmark_count ?? 0,
    };
  } catch {
    return null;
  }
}
