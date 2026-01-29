"use client";

import { Plus } from "lucide-react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { TweetEditor } from "@/components/compose/tweet-editor";
import { MAX_THREAD_ITEMS } from "@/lib/constants";
import type { ThreadItemState } from "@/lib/types";

interface ThreadBuilderProps {
  items: ThreadItemState[];
  onUpdate: (items: ThreadItemState[]) => void;
}

export function ThreadBuilder({ items, onUpdate }: ThreadBuilderProps) {
  const canAdd = items.length < MAX_THREAD_ITEMS;

  function handleTextChange(id: string, text: string) {
    onUpdate(
      items.map((item) => (item.id === id ? { ...item, text } : item))
    );
  }

  function handleRemove(id: string) {
    if (items.length <= 1) return;
    onUpdate(items.filter((item) => item.id !== id));
  }

  function handleAdd() {
    if (!canAdd) return;
    onUpdate([
      ...items,
      { id: nanoid(), text: "", images: [], pollOptions: [] },
    ]);
  }

  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <div key={item.id} className="relative">
          {/* Vertical connector line */}
          {index > 0 && (
            <div className="absolute left-6 -top-4 h-4 w-0.5 bg-border" />
          )}
          {index < items.length - 1 && (
            <div className="absolute left-6 -bottom-4 h-4 w-0.5 bg-border" />
          )}

          <div className={index > 0 ? "mt-4" : ""}>
            <TweetEditor
              value={item.text}
              onChange={(text) => handleTextChange(item.id, text)}
              position={items.length > 1 ? index + 1 : 0}
              onRemove={() => handleRemove(item.id)}
              showRemove={items.length > 1}
            />
          </div>
        </div>
      ))}

      {/* Add to thread button */}
      {canAdd && (
        <div className="mt-3 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            type="button"
            className="gap-1.5 text-muted-foreground"
          >
            <Plus className="size-4" />
            Add to thread
          </Button>
        </div>
      )}
    </div>
  );
}
