"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { acceptSuggestion, rejectSuggestion } from "@/actions/suggestions";
import { toast } from "sonner";
import { InlineThreadItem } from "./inline-thread-item";
import { FeedbackCommentsSection } from "./feedback-comments-section";
import type {
  FeedbackComment,
  FeedbackSuggestion,
  ThreadItemInfo,
} from "./types";

interface FeedbackReviewPanelProps {
  postId: string;
  onClose: () => void;
  onEdit: () => void;
  onMutate?: () => void;
}

export function FeedbackReviewPanel({
  postId,
  onClose,
  onEdit,
  onMutate,
}: FeedbackReviewPanelProps) {
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [suggestions, setSuggestions] = useState<FeedbackSuggestion[]>([]);
  const [threadItems, setThreadItems] = useState<ThreadItemInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
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
  }, [postId]);

  const handleAccept = useCallback(
    async (suggestionId: string) => {
      setActingOn(suggestionId);
      try {
        const suggestion = suggestions.find((s) => s.id === suggestionId);
        const result = await acceptSuggestion(suggestionId);
        if (result.success) {
          // Update suggestion status
          setSuggestions((prev) =>
            prev.map((s) =>
              s.id === suggestionId
                ? { ...s, status: "ACCEPTED" as const }
                : s
            )
          );
          // Update the thread item text so subsequent diffs reflect the change
          if (suggestion) {
            setThreadItems((prev) =>
              prev.map((t) =>
                t.position === suggestion.threadItemPosition
                  ? { ...t, text: suggestion.suggestedText }
                  : t
              )
            );
          }
          toast.success("Suggestion accepted — post text updated");
          onMutate?.();
        } else {
          toast.error(result.error || "Failed to accept suggestion");
        }
      } finally {
        setActingOn(null);
      }
    },
    [suggestions, onMutate]
  );

  const handleReject = useCallback(
    async (suggestionId: string) => {
      setActingOn(suggestionId);
      try {
        const result = await rejectSuggestion(suggestionId);
        if (result.success) {
          setSuggestions((prev) =>
            prev.map((s) =>
              s.id === suggestionId
                ? { ...s, status: "REJECTED" as const }
                : s
            )
          );
          toast.success("Suggestion rejected");
        } else {
          toast.error(result.error || "Failed to reject suggestion");
        }
      } finally {
        setActingOn(null);
      }
    },
    []
  );

  // Group suggestions by thread item position
  const suggestionsByPosition = suggestions.reduce<
    Record<number, FeedbackSuggestion[]>
  >((acc, s) => {
    (acc[s.threadItemPosition] ??= []).push(s);
    return acc;
  }, {});

  const pendingCount = suggestions.filter(
    (s) => s.status === "PENDING"
  ).length;
  const isMultiTweet = threadItems.length > 1;

  return (
    <div className="h-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8"
          onClick={onClose}
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">Back to dashboard</span>
        </Button>

        <h2 className="text-lg font-semibold">Review Feedback</h2>

        {pendingCount > 0 && (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
          >
            {pendingCount} pending
          </Badge>
        )}

        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1.5 size-3.5" />
            Edit Post
          </Button>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Thread items with inline suggestions */}
          {threadItems.map((item, index) => (
            <InlineThreadItem
              key={item.position}
              threadItem={item}
              suggestions={suggestionsByPosition[item.position] ?? []}
              isMultiTweet={isMultiTweet}
              isLast={index === threadItems.length - 1}
              actingId={actingOn}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}

          {/* Empty state if no suggestions */}
          {suggestions.length === 0 && comments.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No feedback yet.
            </p>
          )}

          {/* Separator + Comments */}
          {comments.length > 0 && (
            <>
              <Separator />
              <FeedbackCommentsSection comments={comments} />
            </>
          )}

          {/* Show comments section even when empty if there are suggestions */}
          {comments.length === 0 && suggestions.length > 0 && (
            <>
              <Separator />
              <FeedbackCommentsSection comments={[]} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
