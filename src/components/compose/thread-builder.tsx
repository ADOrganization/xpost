"use client";

import { Plus, GripVertical } from "lucide-react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { TweetEditor } from "@/components/compose/tweet-editor";
import { MAX_THREAD_ITEMS } from "@/lib/constants";
import type { ThreadItemState, MediaState } from "@/lib/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface ThreadBuilderProps {
  items: ThreadItemState[];
  onUpdate: (items: ThreadItemState[]) => void;
  pollEnabled?: boolean;
}

function SortableItem({
  item,
  index,
  items,
  onTextChange,
  onMediaChange,
  onRemove,
  pollEnabled,
}: {
  item: ThreadItemState;
  index: number;
  items: ThreadItemState[];
  onTextChange: (id: string, text: string) => void;
  onMediaChange: (id: string, media: MediaState[]) => void;
  onRemove: (id: string) => void;
  pollEnabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "z-10 opacity-80",
        index > 0 && "mt-4"
      )}
    >
      {/* Vertical connector line */}
      {index > 0 && (
        <div className="absolute left-6 -top-4 h-4 w-0.5 bg-border" />
      )}
      {index < items.length - 1 && (
        <div className="absolute left-6 -bottom-4 h-4 w-0.5 bg-border" />
      )}

      <div className="flex gap-1">
        {/* Drag handle - only show for threads */}
        {items.length > 1 && (
          <button
            type="button"
            className="mt-3 flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:text-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        )}

        <div className="flex-1">
          <TweetEditor
            value={item.text}
            onChange={(text) => onTextChange(item.id, text)}
            position={items.length > 1 ? index + 1 : 0}
            onRemove={() => onRemove(item.id)}
            showRemove={items.length > 1}
            media={item.images}
            onMediaChange={(media) => onMediaChange(item.id, media)}
            mediaDisabled={pollEnabled && index === 0}
          />
        </div>
      </div>
    </div>
  );
}

export function ThreadBuilder({ items, onUpdate, pollEnabled = false }: ThreadBuilderProps) {
  const canAdd = items.length < MAX_THREAD_ITEMS;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleTextChange(id: string, text: string) {
    onUpdate(
      items.map((item) => (item.id === id ? { ...item, text } : item))
    );
  }

  function handleMediaChange(id: string, media: MediaState[]) {
    onUpdate(
      items.map((item) => (item.id === id ? { ...item, images: media } : item))
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onUpdate(reordered);
  }

  return (
    <div className="space-y-0">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item, index) => (
            <SortableItem
              key={item.id}
              item={item}
              index={index}
              items={items}
              onTextChange={handleTextChange}
              onMediaChange={handleMediaChange}
              onRemove={handleRemove}
              pollEnabled={pollEnabled}
            />
          ))}
        </SortableContext>
      </DndContext>

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
