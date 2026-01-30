"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Loader2 } from "lucide-react";
import { acceptSuggestion, rejectSuggestion } from "@/actions/suggestions";
import { toast } from "sonner";
import type {
  FeedbackComment,
  FeedbackSuggestion,
  ThreadItemInfo,
} from "@/components/feedback/types";
import { SUGGESTION_STATUS_STYLE } from "@/components/feedback/types";

// ─── Types ───

interface FeedbackDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMutate?: () => void;
}

// ─── Component ───

export function FeedbackDialog({
  postId,
  open,
  onOpenChange,
  onMutate,
}: FeedbackDialogProps) {
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [suggestions, setSuggestions] = useState<FeedbackSuggestion[]>([]);
  const [threadItems, setThreadItems] = useState<ThreadItemInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setIsLoading(true);
    fetch(`/api/posts/${postId}/share-feedback`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch feedback");
        return res.json();
      })
      .then((data) => {
        setComments(data.comments ?? []);
        setSuggestions(data.suggestions ?? []);
        setThreadItems(data.threadItems ?? []);
      })
      .catch(() => {
        toast.error("Failed to load feedback");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [open, postId]);

  function getOriginalText(position: number): string {
    return threadItems.find((t) => t.position === position)?.text ?? "";
  }

  async function handleAccept(suggestionId: string) {
    setActingOn(suggestionId);
    try {
      const result = await acceptSuggestion(suggestionId);
      if (result.success) {
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === suggestionId ? { ...s, status: "ACCEPTED" as const } : s
          )
        );
        toast.success("Suggestion accepted — post text updated");
        onMutate?.();
      } else {
        toast.error(result.error || "Failed to accept suggestion");
      }
    } finally {
      setActingOn(null);
    }
  }

  async function handleReject(suggestionId: string) {
    setActingOn(suggestionId);
    try {
      const result = await rejectSuggestion(suggestionId);
      if (result.success) {
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === suggestionId ? { ...s, status: "REJECTED" as const } : s
          )
        );
        toast.success("Suggestion rejected");
      } else {
        toast.error(result.error || "Failed to reject suggestion");
      }
    } finally {
      setActingOn(null);
    }
  }

  // Group suggestions by thread item position
  const suggestionsByPosition = suggestions.reduce<Record<number, FeedbackSuggestion[]>>(
    (acc, s) => {
      (acc[s.threadItemPosition] ??= []).push(s);
      return acc;
    },
    {}
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Feedback</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Suggestions section */}
              {suggestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">
                    Suggestions ({suggestions.length})
                  </h3>

                  {Object.entries(suggestionsByPosition).map(
                    ([posStr, posSuggestions]) => {
                      const position = Number(posStr);
                      const originalText = getOriginalText(position);

                      return (
                        <div key={posStr} className="space-y-2">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            Tweet {position + 1}
                          </span>

                          {posSuggestions.map((s) => {
                            const style = SUGGESTION_STATUS_STYLE[s.status];
                            const isActing = actingOn === s.id;

                            return (
                              <div
                                key={s.id}
                                className="rounded-lg border p-3 text-sm space-y-2"
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    {s.user.image && (
                                      <AvatarImage
                                        src={s.user.image}
                                        alt={s.user.name ?? ""}
                                      />
                                    )}
                                    <AvatarFallback className="text-[10px]">
                                      {(s.user.name ?? "?").charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium">
                                    {s.user.name ?? "Anonymous"}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 ${style.className}`}
                                  >
                                    {style.label}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground ml-auto">
                                    {formatDistanceToNow(new Date(s.createdAt), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                </div>

                                {/* Diff view */}
                                <div className="rounded-md bg-muted/40 p-2 space-y-1">
                                  <p className="text-xs whitespace-pre-wrap line-through text-red-400/80">
                                    {originalText}
                                  </p>
                                  <p className="text-xs whitespace-pre-wrap text-green-500">
                                    {s.suggestedText}
                                  </p>
                                </div>

                                {s.note && (
                                  <p className="text-[11px] text-muted-foreground italic">
                                    Note: {s.note}
                                  </p>
                                )}

                                {/* Accept/Reject buttons */}
                                {s.status === "PENDING" && (
                                  <div className="flex gap-2 pt-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs text-green-600 border-green-500/30 hover:bg-green-500/10"
                                      onClick={() => handleAccept(s.id)}
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
                                      onClick={() => handleReject(s.id)}
                                      disabled={isActing}
                                    >
                                      <X className="mr-1 size-3" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {/* Comments section */}
              {comments.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">
                    Comments ({comments.length})
                  </h3>

                  {comments.map((comment) => (
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
                  ))}
                </div>
              )}

              {/* Empty state */}
              {comments.length === 0 && suggestions.length === 0 && !isLoading && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No feedback yet.
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
