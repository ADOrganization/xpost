"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { InlineSuggestionCard } from "./inline-suggestion-card";
import type { FeedbackSuggestion, ThreadItemInfo } from "./types";

interface InlineThreadItemProps {
  threadItem: ThreadItemInfo;
  suggestions: FeedbackSuggestion[];
  isMultiTweet: boolean;
  isLast: boolean;
  actingId: string | null;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function InlineThreadItem({
  threadItem,
  suggestions,
  isMultiTweet,
  isLast,
  actingId,
  onAccept,
  onReject,
}: InlineThreadItemProps) {
  const pendingSuggestions = suggestions.filter(
    (s) => s.status === "PENDING"
  );
  const resolvedSuggestions = suggestions.filter(
    (s) => s.status !== "PENDING"
  );
  const [showResolved, setShowResolved] = useState(false);

  return (
    <div className="relative flex gap-3">
      {/* Thread position indicator */}
      {isMultiTweet && (
        <div className="flex flex-col items-center shrink-0">
          <div className="flex items-center justify-center size-7 rounded-full border bg-muted text-xs font-semibold">
            {threadItem.position + 1}
          </div>
          {/* Vertical connector line */}
          {!isLast && (
            <div className="w-px flex-1 bg-border mt-1" />
          )}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 min-w-0 space-y-2 pb-4">
        {/* Read-only tweet text card */}
        <div className="rounded-lg border bg-card p-3">
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {threadItem.text}
          </p>
        </div>

        {/* Pending suggestions rendered directly */}
        {pendingSuggestions.length > 0 && (
          <div className="space-y-2">
            {pendingSuggestions.map((s) => (
              <InlineSuggestionCard
                key={s.id}
                suggestion={s}
                originalText={threadItem.text}
                actingId={actingId}
                onAccept={onAccept}
                onReject={onReject}
              />
            ))}
          </div>
        )}

        {/* Resolved suggestions collapsed */}
        {resolvedSuggestions.length > 0 && (
          <div>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowResolved((prev) => !prev)}
            >
              {showResolved ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
              {resolvedSuggestions.length} resolved suggestion
              {resolvedSuggestions.length !== 1 ? "s" : ""}
            </button>

            {showResolved && (
              <div className="space-y-2 mt-2">
                {resolvedSuggestions.map((s) => (
                  <InlineSuggestionCard
                    key={s.id}
                    suggestion={s}
                    originalText={threadItem.text}
                    resolved
                    actingId={actingId}
                    onAccept={onAccept}
                    onReject={onReject}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
