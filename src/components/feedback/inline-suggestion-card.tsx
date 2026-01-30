"use client";

import { formatDistanceToNow } from "date-fns";
import { Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { FeedbackSuggestion } from "./types";
import { SUGGESTION_STATUS_STYLE } from "./types";

interface InlineSuggestionCardProps {
  suggestion: FeedbackSuggestion;
  originalText: string;
  resolved?: boolean;
  actingId: string | null;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function InlineSuggestionCard({
  suggestion,
  originalText,
  resolved = false,
  actingId,
  onAccept,
  onReject,
}: InlineSuggestionCardProps) {
  const style = SUGGESTION_STATUS_STYLE[suggestion.status];
  const isActing = actingId === suggestion.id;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-sm space-y-2 transition-opacity",
        suggestion.status === "ACCEPTED" && "border-green-500/20 bg-green-500/5",
        suggestion.status === "REJECTED" && "border-red-500/20 bg-red-500/5",
        suggestion.status === "PENDING" && "border-yellow-500/20 bg-yellow-500/5",
        resolved && "opacity-60"
      )}
    >
      {/* Header: avatar + name + badge + time */}
      <div className="flex items-center gap-2">
        <Avatar className="h-5 w-5">
          {suggestion.user.image && (
            <AvatarImage
              src={suggestion.user.image}
              alt={suggestion.user.name ?? ""}
            />
          )}
          <AvatarFallback className="text-[10px]">
            {(suggestion.user.name ?? "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium">
          {suggestion.user.name ?? "Anonymous"}
        </span>
        <Badge
          variant="outline"
          className={cn("text-[10px] px-1.5 py-0", style.className)}
        >
          {style.label}
        </Badge>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {formatDistanceToNow(new Date(suggestion.createdAt), {
            addSuffix: true,
          })}
        </span>
      </div>

      {/* Diff view */}
      <div className="rounded-md bg-muted/40 p-2 space-y-1.5">
        <div>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Original
          </span>
          <p className="text-xs whitespace-pre-wrap line-through text-red-400/80 mt-0.5">
            {originalText}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Suggested
          </span>
          <p className="text-xs whitespace-pre-wrap text-green-500 mt-0.5">
            {suggestion.suggestedText}
          </p>
        </div>
      </div>

      {/* Note */}
      {suggestion.note && (
        <p className="text-[11px] text-muted-foreground italic">
          Note: {suggestion.note}
        </p>
      )}

      {/* Accept/Reject buttons */}
      {suggestion.status === "PENDING" && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-green-600 border-green-500/30 hover:bg-green-500/10"
            onClick={() => onAccept(suggestion.id)}
            disabled={isActing}
          >
            {isActing ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : (
              <Check className="mr-1 size-3" />
            )}
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
            onClick={() => onReject(suggestion.id)}
            disabled={isActing}
          >
            <X className="mr-1 size-3" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
