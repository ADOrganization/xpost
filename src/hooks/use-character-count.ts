import { TWEET_CHAR_LIMIT, URL_CHAR_COUNT } from "@/lib/constants";

const URL_REGEX = /https?:\/\/[^\s]+/g;

function computeCharacterCount(text: string): number {
  // Replace all URLs with a placeholder of URL_CHAR_COUNT length
  // X counts every URL as exactly 23 characters regardless of actual length
  const withoutUrls = text.replace(URL_REGEX, "");
  const urlMatches = text.match(URL_REGEX);
  const urlCount = urlMatches ? urlMatches.length : 0;

  return withoutUrls.length + urlCount * URL_CHAR_COUNT;
}

export function useCharacterCount(text: string) {
  const count = computeCharacterCount(text);
  const remaining = TWEET_CHAR_LIMIT - count;
  const isOver = remaining < 0;

  return { count, remaining, isOver };
}
