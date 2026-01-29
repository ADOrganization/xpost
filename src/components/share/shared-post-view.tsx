"use client";

import { useState } from "react";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { TweetPreview } from "@/components/compose/tweet-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, LogIn, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import type { MediaState } from "@/lib/types";

// ─── Types ───

interface PostMedia {
  id: string;
  url: string;
  altText: string | null;
  position: number;
  mediaType: "IMAGE" | "VIDEO" | "GIF";
}

interface PollOption {
  id: string;
  label: string;
  position: number;
}

interface ThreadItem {
  id: string;
  position: number;
  text: string;
  media: PostMedia[];
  pollOptions: PollOption[];
}

interface XAccount {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
}

interface Post {
  id: string;
  status: string;
  threadItems: ThreadItem[];
  xAccount?: XAccount | null;
}

interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface ShareCommentData {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
}

interface ShareSuggestionData {
  id: string;
  threadItemPosition: number;
  suggestedText: string;
  note: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  user: CommentUser;
}

interface SharedPostViewProps {
  post: Post;
  comments: ShareCommentData[];
  suggestions: ShareSuggestionData[];
  shareLinkId: string;
  token: string;
  isSignedIn: boolean;
}

// ─── Helpers ───

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In Review",
  SCHEDULED: "Scheduled",
  PUBLISHING: "Publishing",
  PUBLISHED: "Published",
  FAILED: "Failed",
};

const SUGGESTION_STATUS_STYLE: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  ACCEPTED: { label: "Accepted", className: "bg-green-500/10 text-green-600 border-green-500/30" },
  REJECTED: { label: "Rejected", className: "bg-red-500/10 text-red-600 border-red-500/30" },
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Suggest Edit Form ───

function SuggestEditForm({
  originalText,
  threadItemPosition,
  token,
  onCancel,
  onSubmitted,
}: {
  originalText: string;
  threadItemPosition: number;
  token: string;
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const [suggestedText, setSuggestedText] = useState(originalText);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const text = suggestedText.trim();
    if (!text) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/share/${token}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadItemPosition, suggestedText: text, note: note.trim() || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to submit suggestion");
        return;
      }

      toast.success("Suggestion submitted");
      onSubmitted();
    } catch {
      toast.error("Failed to submit suggestion");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border p-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Suggest Edit</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}>
          <X className="size-3" />
        </Button>
      </div>
      <Textarea
        value={suggestedText}
        onChange={(e) => setSuggestedText(e.target.value)}
        className="min-h-[80px] resize-none text-sm"
        maxLength={280}
      />
      <Textarea
        placeholder="Optional note explaining the change..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-[40px] resize-none text-sm"
        maxLength={500}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting || !suggestedText.trim() || suggestedText.trim() === originalText}
        >
          Submit Suggestion
        </Button>
      </div>
    </div>
  );
}

// ─── Component ───

export function SharedPostView({
  post,
  comments: initialComments,
  suggestions: initialSuggestions,
  token,
  isSignedIn,
}: SharedPostViewProps) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPosition, setEditingPosition] = useState<number | null>(null);

  const { data: commentsData, mutate: mutateComments } = useSWR<{
    comments: ShareCommentData[];
  }>(`/api/share/${token}/comments`, fetcher, {
    fallbackData: { comments: initialComments },
    refreshInterval: 15000,
  });

  const { data: suggestionsData, mutate: mutateSuggestions } = useSWR<{
    suggestions: ShareSuggestionData[];
  }>(`/api/share/${token}/suggestions`, fetcher, {
    fallbackData: { suggestions: initialSuggestions },
    refreshInterval: 15000,
  });

  const comments = commentsData?.comments ?? initialComments;
  const suggestions = suggestionsData?.suggestions ?? initialSuggestions;

  const displayName = post.xAccount?.displayName ?? "Author";
  const username = post.xAccount?.username ?? "user";
  const profileImageUrl = post.xAccount?.profileImageUrl ?? null;

  async function handleSubmitComment() {
    const content = commentText.trim();
    if (!content) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/share/${token}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to submit comment");
        return;
      }

      setCommentText("");
      mutateComments();
      toast.success("Comment added");
    } catch {
      toast.error("Failed to submit comment");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Group suggestions by thread item position
  function getSuggestionsForPosition(position: number) {
    return suggestions.filter((s) => s.threadItemPosition === position);
  }

  return (
    <div className="space-y-6">
      {/* Post Preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Post Preview</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {STATUS_LABELS[post.status] ?? post.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {post.threadItems.map((item, index) => {
              const media: MediaState[] = item.media.map((m) => ({
                url: m.url,
                altText: m.altText ?? "",
                mediaType: m.mediaType,
              }));

              const pollOptions =
                index === 0
                  ? item.pollOptions.map((o) => o.label)
                  : undefined;

              const itemSuggestions = getSuggestionsForPosition(item.position);

              return (
                <div key={item.id}>
                  <TweetPreview
                    text={item.text}
                    media={media}
                    displayName={displayName}
                    username={username}
                    profileImageUrl={profileImageUrl}
                    pollOptions={pollOptions}
                    isThread={post.threadItems.length > 1}
                    showConnector={index < post.threadItems.length - 1}
                    hideActions
                  />

                  {/* Suggest Edit button */}
                  {isSignedIn && editingPosition !== item.position && (
                    <div className="flex justify-end px-2 pb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingPosition(item.position)}
                      >
                        <Pencil className="mr-1 size-3" />
                        Suggest Edit
                      </Button>
                    </div>
                  )}

                  {/* Inline suggest edit form */}
                  {editingPosition === item.position && (
                    <div className="px-2 pb-2">
                      <SuggestEditForm
                        originalText={item.text}
                        threadItemPosition={item.position}
                        token={token}
                        onCancel={() => setEditingPosition(null)}
                        onSubmitted={() => {
                          setEditingPosition(null);
                          mutateSuggestions();
                        }}
                      />
                    </div>
                  )}

                  {/* Existing suggestions for this item */}
                  {itemSuggestions.length > 0 && (
                    <div className="px-2 pb-3 space-y-2">
                      {itemSuggestions.map((s) => {
                        const style = SUGGESTION_STATUS_STYLE[s.status];
                        return (
                          <div
                            key={s.id}
                            className="rounded-lg border p-3 text-sm space-y-1.5 bg-muted/20"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                {s.user.image && (
                                  <AvatarImage src={s.user.image} alt={s.user.name ?? ""} />
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
                                {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                              <span className="line-through text-red-400/70">{item.text}</span>
                            </p>
                            <p className="text-xs whitespace-pre-wrap text-green-500">
                              {s.suggestedText}
                            </p>
                            {s.note && (
                              <p className="text-[11px] text-muted-foreground italic">
                                Note: {s.note}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Feedback ({comments.length + suggestions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing comments */}
          {comments.length === 0 && suggestions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No feedback yet. Be the first to leave a comment or suggest an edit.
            </p>
          )}

          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                {comment.user.image && (
                  <AvatarImage src={comment.user.image} alt={comment.user.name ?? ""} />
                )}
                <AvatarFallback className="text-xs">
                  {(comment.user.name ?? "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.user.name ?? "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
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

          {/* Comment form or sign-in prompt */}
          {isSignedIn ? (
            <div className="flex gap-3 pt-2 border-t">
              <Textarea
                placeholder="Leave feedback on this post..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={2000}
              />
              <Button
                size="icon"
                onClick={handleSubmitComment}
                disabled={isSubmitting || !commentText.trim()}
                className="shrink-0 self-end"
              >
                <Send className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              <LogIn className="size-4" />
              <span>
                <a href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </a>{" "}
                to leave feedback
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
