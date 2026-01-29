"use client";

import { TweetPreview } from "@/components/compose/tweet-preview";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ThreadItemState, XAccountOption } from "@/lib/types";

interface ThreadPreviewProps {
  items: ThreadItemState[];
  account: XAccountOption;
  pollOptions?: string[];
}

export function ThreadPreview({ items, account, pollOptions }: ThreadPreviewProps) {
  const nonEmptyItems = items.filter(
    (item) => item.text.trim().length > 0 || item.images.length > 0
  );

  if (nonEmptyItems.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">Preview</p>
      </div>
      <ScrollArea className="max-h-[calc(100vh-200px)]">
        <div className="p-4">
          {nonEmptyItems.map((item, index) => (
            <TweetPreview
              key={item.id}
              text={item.text}
              media={item.images}
              displayName={account.displayName}
              username={account.username}
              profileImageUrl={account.profileImageUrl}
              pollOptions={index === 0 ? pollOptions : undefined}
              isThread={nonEmptyItems.length > 1}
              showConnector={index < nonEmptyItems.length - 1}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
