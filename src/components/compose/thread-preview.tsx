"use client";

import { TweetPreview } from "@/components/compose/tweet-preview";
import type { ThreadItemState, XAccountOption } from "@/lib/types";

interface ThreadPreviewProps {
  items: ThreadItemState[];
  account: XAccountOption;
  pollOptions?: string[];
}

export function ThreadPreview({ items, account, pollOptions }: ThreadPreviewProps) {
  const nonEmptyItems = items.filter((item) => item.text.trim().length > 0);

  if (nonEmptyItems.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Preview
      </p>
      <div>
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
    </div>
  );
}
