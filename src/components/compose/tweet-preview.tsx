"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { parseTweet } from "@/lib/tweet-parser";
import { cn } from "@/lib/utils";
import { Heart, MessageCircle, Repeat2, Bookmark, Share } from "lucide-react";
import type { MediaState } from "@/lib/types";

interface TweetPreviewProps {
  text: string;
  media: MediaState[];
  displayName: string;
  username: string;
  profileImageUrl: string | null;
  pollOptions?: string[];
  isThread?: boolean;
  showConnector?: boolean;
  hideActions?: boolean;
}

export function TweetPreview({
  text,
  media,
  displayName,
  username,
  profileImageUrl,
  pollOptions,
  isThread = false,
  showConnector = false,
  hideActions = false,
}: TweetPreviewProps) {
  const segments = parseTweet(text);

  return (
    <div className="flex gap-3">
      {/* Avatar column */}
      <div className="flex flex-col items-center">
        <Avatar className="h-10 w-10 shrink-0">
          {profileImageUrl && (
            <AvatarImage src={profileImageUrl} alt={displayName} />
          )}
          <AvatarFallback className="text-sm">
            {displayName ? displayName.charAt(0).toUpperCase() : "?"}
          </AvatarFallback>
        </Avatar>
        {showConnector && (
          <div className="mt-1 w-0.5 flex-1 bg-border" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pb-3">
        {/* Header */}
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold">{displayName}</span>
          <span className="truncate text-sm text-muted-foreground">@{username}</span>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">now</span>
        </div>

        {/* Text with highlighting */}
        {text && (
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {segments.map((seg, i) => {
              if (seg.type === "hashtag" || seg.type === "mention") {
                return (
                  <span key={i} className="text-x-blue">
                    {seg.value}
                  </span>
                );
              }
              if (seg.type === "url") {
                return (
                  <span key={i} className="text-x-blue">
                    {seg.value.replace(/^https?:\/\//, "").slice(0, 30)}
                    {seg.value.length > 37 ? "..." : ""}
                  </span>
                );
              }
              return <span key={i}>{seg.value}</span>;
            })}
          </p>
        )}

        {/* Poll preview */}
        {pollOptions && pollOptions.filter(Boolean).length >= 2 && (
          <div className="mt-3 space-y-2">
            {pollOptions.filter(Boolean).map((opt, i) => (
              <div
                key={i}
                className="rounded-full border border-primary px-4 py-2 text-center text-sm font-medium text-primary"
              >
                {opt}
              </div>
            ))}
          </div>
        )}

        {/* Media grid — matches X's exact layout */}
        {media.length === 1 && (
          <div className="mt-3 overflow-hidden rounded-2xl border">
            <div className="relative aspect-video bg-muted">
              {media[0].mediaType === "VIDEO" ? (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <div className="rounded-full bg-black/60 p-3">
                    <div className="ml-0.5 h-0 w-0 border-y-[8px] border-l-[14px] border-y-transparent border-l-white" />
                  </div>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media[0].url}
                  alt={media[0].altText || ""}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
        )}

        {media.length >= 2 && (
          <div
            className={cn(
              "mt-3 grid aspect-video gap-0.5 overflow-hidden rounded-2xl border",
              media.length === 2 && "grid-cols-2",
              media.length >= 3 && "grid-cols-2 grid-rows-2"
            )}
          >
            {media.map((m, index) => (
              <div
                key={`${m.url}-${index}`}
                className={cn(
                  "relative min-h-0 min-w-0 overflow-hidden bg-muted",
                  media.length === 3 && index === 0 && "row-span-2"
                )}
              >
                {m.mediaType === "VIDEO" ? (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <div className="rounded-full bg-black/60 p-3">
                      <div className="ml-0.5 h-0 w-0 border-y-[8px] border-l-[14px] border-y-transparent border-l-white" />
                    </div>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt={m.altText || ""}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action bar */}
        {!hideActions && (
          <div className="mt-3 flex justify-between text-muted-foreground">
            <button className="flex items-center gap-1 text-xs hover:text-primary transition-colors">
              <MessageCircle className="size-4" />
            </button>
            <button className="flex items-center gap-1 text-xs hover:text-green-500 transition-colors">
              <Repeat2 className="size-4" />
            </button>
            <button className="flex items-center gap-1 text-xs hover:text-pink-500 transition-colors">
              <Heart className="size-4" />
            </button>
            <button className="flex items-center gap-1 text-xs hover:text-primary transition-colors">
              <Bookmark className="size-4" />
            </button>
            <button className="flex items-center gap-1 text-xs hover:text-primary transition-colors">
              <Share className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
