export type TweetSegment = {
  type: "text" | "hashtag" | "mention" | "url";
  value: string;
};

const TWEET_PATTERN = /(#[\w\u0080-\uffff]+)|(@[\w]+)|(https?:\/\/[^\s]+)/g;

export function parseTweet(text: string): TweetSegment[] {
  const segments: TweetSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(TWEET_PATTERN)) {
    const matchStart = match.index!;
    if (matchStart > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, matchStart) });
    }

    if (match[1]) {
      segments.push({ type: "hashtag", value: match[1] });
    } else if (match[2]) {
      segments.push({ type: "mention", value: match[2] });
    } else if (match[3]) {
      segments.push({ type: "url", value: match[3] });
    }

    lastIndex = matchStart + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}
