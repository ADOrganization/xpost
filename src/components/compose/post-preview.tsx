"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ImageState } from "@/lib/types";

interface PostPreviewProps {
  text: string;
  images: ImageState[];
  displayName: string;
  username: string;
  profileImageUrl: string | null;
}

export function PostPreview({
  text,
  images,
  displayName,
  username,
  profileImageUrl,
}: PostPreviewProps) {
  if (!text && images.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Preview
      </p>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          <Avatar>
            {profileImageUrl && (
              <AvatarImage src={profileImageUrl} alt={displayName} />
            )}
            <AvatarFallback>
              {displayName ? displayName.charAt(0).toUpperCase() : "?"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{displayName}</span>
            <span className="truncate text-sm text-muted-foreground">
              @{username}
            </span>
          </div>

          {/* Text */}
          {text && (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">
              {text}
            </p>
          )}

          {/* Image grid */}
          {images.length > 0 && (
            <div
              className={cn(
                "mt-3 grid gap-0.5 overflow-hidden rounded-xl border",
                images.length === 1 && "grid-cols-1",
                images.length === 2 && "grid-cols-2",
                images.length >= 3 && "grid-cols-2"
              )}
            >
              {images.map((image, index) => (
                <div
                  key={`${image.url}-${index}`}
                  className={cn(
                    "relative overflow-hidden bg-muted",
                    images.length === 1 && "aspect-video",
                    images.length === 2 && "aspect-square",
                    images.length === 3 &&
                      index === 0 &&
                      "row-span-2 aspect-auto h-full",
                    images.length === 3 && index > 0 && "aspect-square",
                    images.length === 4 && "aspect-square"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.altText || `Image ${index + 1}`}
                    className="size-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
