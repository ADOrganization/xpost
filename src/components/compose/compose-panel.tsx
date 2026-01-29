"use client";

import { useReducer, useCallback, useEffect } from "react";
import { nanoid } from "nanoid";
import { Send, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AccountSelector } from "@/components/compose/account-selector";
import { ThreadBuilder } from "@/components/compose/thread-builder";
import { ImageUpload } from "@/components/compose/image-upload";
import { PollBuilder } from "@/components/compose/poll-builder";
import { SchedulePicker } from "@/components/compose/schedule-picker";
import { PostPreview } from "@/components/compose/post-preview";
import { MIN_POLL_OPTIONS } from "@/lib/constants";
import { createPost, updatePost } from "@/actions/posts";
import { toast } from "sonner";
import type { ImageState, ThreadItemState, XAccountOption } from "@/lib/types";

// ---------------------------------------------------------------------------
// EditingPost type (exported for use by parent components)
// ---------------------------------------------------------------------------

export interface EditingPost {
  id: string;
  threadItems: { text: string; images: { url: string; altText: string }[] }[];
  pollOptions: string[];
  xAccountId: string | null;
  scheduledAt: string | null;
  status: string;
}

// ---------------------------------------------------------------------------
// State & reducer
// ---------------------------------------------------------------------------

interface ComposeState {
  items: ThreadItemState[];
  pollOptions: string[];
  pollEnabled: boolean;
  pollDuration: number;
  scheduledAt: Date | null;
  selectedAccountId: string | null;
  isSaving: boolean;
}

type ComposeAction =
  | { type: "SET_ITEMS"; items: ThreadItemState[] }
  | { type: "SET_POLL_OPTIONS"; options: string[] }
  | { type: "TOGGLE_POLL"; enabled: boolean }
  | { type: "SET_SCHEDULE"; date: Date | null }
  | { type: "SET_ACCOUNT"; id: string | null }
  | { type: "SET_POLL_DURATION"; duration: number }
  | { type: "SET_SAVING"; saving: boolean }
  | { type: "RESET" }
  | { type: "LOAD_POST"; post: EditingPost };

function createInitialState(): ComposeState {
  return {
    items: [{ id: nanoid(), text: "", images: [], pollOptions: [] }],
    pollOptions: Array.from({ length: MIN_POLL_OPTIONS }, () => ""),
    pollEnabled: false,
    pollDuration: 1440,
    scheduledAt: null,
    selectedAccountId: null,
    isSaving: false,
  };
}

function composeReducer(
  state: ComposeState,
  action: ComposeAction
): ComposeState {
  switch (action.type) {
    case "SET_ITEMS":
      return { ...state, items: action.items };
    case "SET_POLL_OPTIONS":
      return { ...state, pollOptions: action.options };
    case "TOGGLE_POLL":
      return { ...state, pollEnabled: action.enabled };
    case "SET_POLL_DURATION":
      return { ...state, pollDuration: action.duration };
    case "SET_SCHEDULE":
      return { ...state, scheduledAt: action.date };
    case "SET_ACCOUNT":
      return { ...state, selectedAccountId: action.id };
    case "SET_SAVING":
      return { ...state, isSaving: action.saving };
    case "RESET":
      return createInitialState();
    case "LOAD_POST": {
      const post = action.post;
      const hasPoll = post.pollOptions.length >= 2;
      const paddedPollOptions = hasPoll
        ? post.pollOptions
        : Array.from({ length: MIN_POLL_OPTIONS }, () => "");
      return {
        items: post.threadItems.map((item) => ({
          id: nanoid(),
          text: item.text,
          images: item.images.map((img) => ({
            url: img.url,
            altText: img.altText,
          })),
          pollOptions: [],
        })),
        pollOptions: paddedPollOptions,
        pollEnabled: hasPoll,
        pollDuration: 1440,
        scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : null,
        selectedAccountId: post.xAccountId,
        isSaving: false,
      };
    }
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Image upload helper
// ---------------------------------------------------------------------------

async function uploadImages(
  images: ImageState[]
): Promise<{ url: string; altText: string }[]> {
  const results: { url: string; altText: string }[] = [];
  for (const img of images) {
    if (img.file) {
      const formData = new FormData();
      formData.append("file", img.file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to upload image");
      const { url } = await res.json();
      results.push({ url, altText: img.altText });
    } else {
      results.push({ url: img.url, altText: img.altText });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ComposePanelProps {
  accounts: XAccountOption[];
  workspaceId: string;
  onPostSaved?: () => void;
  editingPost?: EditingPost | null;
}

export function ComposePanel({
  accounts,
  workspaceId,
  onPostSaved,
  editingPost,
}: ComposePanelProps) {
  const [state, dispatch] = useReducer(composeReducer, undefined, createInitialState);

  const firstItem = state.items[0];
  const hasImages = firstItem.images.length > 0;
  const hasText = state.items.some((item) => item.text.trim().length > 0);
  const isEditing = !!editingPost;

  // Mutual exclusion: poll disables images, images disable poll
  const imageUploadDisabled = state.pollEnabled;
  const pollToggleDisabled = hasImages;

  // Find the selected account for preview
  const selectedAccount = accounts.find(
    (a) => a.id === state.selectedAccountId
  );

  // Load editing post data when editingPost prop changes
  useEffect(() => {
    if (editingPost) {
      dispatch({ type: "LOAD_POST", post: editingPost });
    }
  }, [editingPost]);

  // Handlers ------------------------------------------------------------------

  const handleItemsUpdate = useCallback(
    (items: ThreadItemState[]) => {
      dispatch({ type: "SET_ITEMS", items });
    },
    []
  );

  const handleFirstItemImagesChange = useCallback(
    (images: typeof firstItem.images) => {
      dispatch({
        type: "SET_ITEMS",
        items: state.items.map((item, i) =>
          i === 0 ? { ...item, images } : item
        ),
      });
    },
    [state.items]
  );

  const handlePollOptionsChange = useCallback(
    (options: string[]) => {
      dispatch({ type: "SET_POLL_OPTIONS", options });
    },
    []
  );

  const handlePollToggle = useCallback(
    (enabled: boolean) => {
      // Don't enable poll if images are present
      if (enabled && hasImages) return;
      dispatch({ type: "TOGGLE_POLL", enabled });
    },
    [hasImages]
  );

  const handlePollDurationChange = useCallback(
    (minutes: number) => {
      dispatch({ type: "SET_POLL_DURATION", duration: minutes });
    },
    []
  );

  const handleScheduleChange = useCallback(
    (date: Date | null) => {
      dispatch({ type: "SET_SCHEDULE", date });
    },
    []
  );

  const handleAccountChange = useCallback(
    (id: string) => {
      dispatch({ type: "SET_ACCOUNT", id });
    },
    []
  );

  async function handleSave(isDraft: boolean) {
    dispatch({ type: "SET_SAVING", saving: true });
    try {
      // Upload images for each thread item
      const processedItems = await Promise.all(
        state.items.map(async (item) => ({
          text: item.text,
          imageUrls: await uploadImages(item.images),
        }))
      );

      const status = isDraft ? ("DRAFT" as const) : ("SCHEDULED" as const);
      const data = {
        workspaceId,
        xAccountId: state.selectedAccountId ?? undefined,
        items: processedItems,
        pollOptions: state.pollEnabled
          ? state.pollOptions.filter((o) => o.trim())
          : undefined,
        scheduledAt: isDraft
          ? undefined
          : (state.scheduledAt ?? undefined),
        status,
      };

      let result;
      if (editingPost) {
        result = await updatePost(editingPost.id, data);
      } else {
        result = await createPost(data);
      }

      if (result.success) {
        toast.success(
          isDraft
            ? "Draft saved"
            : state.scheduledAt
              ? "Post scheduled"
              : "Post queued for publishing"
        );
        dispatch({ type: "RESET" });
        onPostSaved?.();
      } else {
        toast.error(result.error || "Failed to save post");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      dispatch({ type: "SET_SAVING", saving: false });
    }
  }

  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Account selector */}
      <AccountSelector
        accounts={accounts}
        selectedId={state.selectedAccountId}
        onChange={handleAccountChange}
      />

      {/* Thread builder (main editing area) */}
      <ThreadBuilder items={state.items} onUpdate={handleItemsUpdate} />

      {/* Image upload for first thread item */}
      <ImageUpload
        images={firstItem.images}
        onChange={handleFirstItemImagesChange}
        disabled={imageUploadDisabled}
      />

      {/* Poll builder (first item only, mutual exclusion with images) */}
      <PollBuilder
        options={state.pollOptions}
        onChange={handlePollOptionsChange}
        enabled={state.pollEnabled}
        onToggle={handlePollToggle}
        duration={state.pollDuration}
        onDurationChange={handlePollDurationChange}
      />

      <Separator />

      {/* Schedule picker */}
      <SchedulePicker
        date={state.scheduledAt}
        onChange={handleScheduleChange}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => handleSave(true)}
          disabled={state.isSaving || !hasText}
          type="button"
          className="gap-1.5"
        >
          <Save className="size-4" />
          {isEditing ? "Update Draft" : "Save Draft"}
        </Button>
        <Button
          onClick={() => handleSave(false)}
          disabled={state.isSaving || !hasText || !state.selectedAccountId}
          type="button"
          className="gap-1.5"
        >
          <Send className="size-4" />
          {isEditing
            ? "Update"
            : state.scheduledAt
              ? "Schedule"
              : "Post Now"}
        </Button>
      </div>

      {/* Preview */}
      {hasText && selectedAccount && (
        <PostPreview
          text={firstItem.text}
          images={firstItem.images}
          displayName={selectedAccount.displayName}
          username={selectedAccount.username}
          profileImageUrl={selectedAccount.profileImageUrl}
        />
      )}
    </div>
  );
}
