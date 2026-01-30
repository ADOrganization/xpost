"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronRight, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { FeedbackComment } from "./types";

interface FeedbackCommentsSectionProps {
  comments: FeedbackComment[];
}

export function FeedbackCommentsSection({
  comments,
}: FeedbackCommentsSectionProps) {
  const [expanded, setExpanded] = useState(comments.length <= 3);

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="flex items-center gap-2 text-sm font-semibold hover:text-foreground/80 transition-colors"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        <MessageSquare className="size-4" />
        Comments ({comments.length})
      </button>

      {expanded && (
        <div className="space-y-3 pl-1">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No comments on this post.
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-7 w-7 shrink-0">
                  {comment.user.image && (
                    <AvatarImage
                      src={comment.user.image}
                      alt={comment.user.name ?? ""}
                    />
                  )}
                  <AvatarFallback className="text-[10px]">
                    {(comment.user.name ?? "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {comment.user.name ?? "Anonymous"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
