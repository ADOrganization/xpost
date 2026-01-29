"use client";

import { useReducer, useCallback, useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { Send, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AccountSelector } from "@/components/compose/account-selector";
import { ThreadBuilder } from "@/components/compose/thread-builder";
import { PollBuilder } from "@/components/compose/poll-builder";
import { SchedulePicker } from "@/components/compose/schedule-picker";
import { ThreadPreview } from "@/components/compose/thread-preview";
import { MIN_POLL_OPTIONS } from "@/lib/constants";
import { createPost, updatePost, createAndPublishNow } from "@/actions/posts";
import { toast } from "sonner";
import type { MediaState, ThreadItemState, XAccountOption } from "@/lib/types";

// ---------------------------------------------------------------------------
// EditingPost type (exported for use by parent components)
// ---------------------------------------------------------------------------

export interface EditingPost {
  id: string;
  threadItems: { text: string; media: { url: string; altText: string; mediaType: string }[] }[];
  pollOptions: string[];
  pollDuration: number | null;
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
          images: item.media.map((m) => ({
            url: m.url,
            altText: m.altText,
            mediaType: (m.mediaType || "IMAGE") as MediaState["mediaType"],
          })),
          pollOptions: [],
        })),
        pollOptions: paddedPollOptions,
        pollEnabled: hasPoll,
        pollDuration: post.pollDuration ?? 1440,
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
// Media upload helper
// ---------------------------------------------------------------------------

async function uploadMedia(
  media: MediaState[]
): Promise<{ url: string; altText: string; mediaType: string }[]> {
  const results: { url: string; altText: string; mediaType: string }[] = [];
  for (const m of media) {
    if (m.file) {
      const formData = new FormData();
      formData.append("file", m.file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to upload media");
      const data = await res.json();
      results.push({ url: data.url, altText: m.altText, mediaType: data.mediaType || m.mediaType });
    } else {
      results.push({ url: m.url, altText: m.altText, mediaType: m.mediaType });
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
  const [scheduleValid, setScheduleValid] = useState(true);

  const hasMedia = state.items.some((item) => item.images.length > 0);
  const hasText = state.items.some((item) => item.text.trim().length > 0);
  const isEditing = !!editingPost;

  // Mutual exclusion: poll disables media, media disable poll
  const pollToggleDisabled = hasMedia;

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

  const handlePollOptionsChange = useCallback(
    (options: string[]) => {
      dispatch({ type: "SET_POLL_OPTIONS", options });
    },
    []
  );

  const handlePollToggle = useCallback(
    (enabled: boolean) => {
      if (enabled && hasMedia) return;
      dispatch({ type: "TOGGLE_POLL", enabled });
    },
    [hasMedia]
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
      // Upload media for each thread item
      const processedItems = await Promise.all(
        state.items.map(async (item) => ({
          text: item.text,
          imageUrls: await uploadMedia(item.images),
        }))
      );

      const isPostNow = !isDraft && !state.scheduledAt;

      let result;

      if (isPostNow && !editingPost) {
        result = await createAndPublishNow({
          workspaceId,
          xAccountId: state.selectedAccountId!,
          items: processedItems,
          pollOptions: state.pollEnabled
            ? state.pollOptions.filter((o) => o.trim())
            : undefined,
          pollDuration: state.pollEnabled ? state.pollDuration : undefined,
        });
      } else {
        const status = isDraft ? ("DRAFT" as const) : ("SCHEDULED" as const);
        const data = {
          workspaceId,
          xAccountId: state.selectedAccountId ?? undefined,
          items: processedItems,
          pollOptions: state.pollEnabled
            ? state.pollOptions.filter((o) => o.trim())
            : undefined,
          pollDuration: state.pollEnabled ? state.pollDuration : undefined,
          scheduledAt: isDraft ? undefined : state.scheduledAt!,
          status,
        };

        if (editingPost) {
          result = await updatePost(editingPost.id, data);
        } else {
          result = await createPost(data);
        }
      }

      if (result.success) {
        toast.success(
          isDraft
            ? "Draft saved"
            : state.scheduledAt
              ? "Post scheduled"
              : "Posted to X"
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
    <div className="flex flex-col lg:flex-row lg:gap-6">
      {/* LEFT: compose controls */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Account selector */}
        <AccountSelector
          accounts={accounts}
          selectedId={state.selectedAccountId}
          onChange={handleAccountChange}
        />

        {/* Thread builder (main editing area with per-item media) */}
        <ThreadBuilder
          items={state.items}
          onUpdate={handleItemsUpdate}
          pollEnabled={state.pollEnabled}
        />

        {/* Poll builder (first item only, mutual exclusion with media) */}
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
          onValidChange={setScheduleValid}
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
            {state.isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isEditing ? "Update Draft" : "Save Draft"}
          </Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={state.isSaving || !hasText || !state.selectedAccountId || !scheduleValid}
            type="button"
            className="gap-1.5"
          >
            {state.isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {isEditing
              ? "Update"
              : state.scheduledAt
                ? "Schedule"
                : "Post Now"}
          </Button>
        </div>
      </div>

      {/* RIGHT: live preview (sticky, desktop only) */}
      {hasText && selectedAccount && (
        <div className="hidden lg:block lg:w-[340px] lg:shrink-0">
          <div className="sticky top-4">
            <ThreadPreview
              items={state.items}
              account={selectedAccount}
              pollOptions={state.pollEnabled ? state.pollOptions : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
