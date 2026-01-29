"use client";

import { TweetPreview } from "@/components/compose/tweet-preview";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import type { ThreadItemState, XAccountOption } from "@/lib/types";

interface ThreadPreviewProps {
  items: ThreadItemState[];
  account?: XAccountOption | null;
  pollOptions?: string[];
}

export function ThreadPreview({ items, account, pollOptions }: ThreadPreviewProps) {
  const nonEmptyItems = items.filter(
    (item) => item.text.trim().length > 0 || item.images.length > 0
  );

  const showPlaceholder = nonEmptyItems.length === 0 || !account;

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">Preview</p>
      </div>
      {showPlaceholder ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
          <FileText className="size-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            {!account
              ? "Select an account to see preview"
              : "Start typing to see preview"}
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-120px)]">
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
      )}
    </div>
  );
}
