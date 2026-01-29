"use client";

import { useRef, useEffect, useCallback } from "react";
import { X, ImagePlus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AiAssist } from "@/components/compose/ai-assist";
import { MediaUpload } from "@/components/compose/media-upload";
import { useCharacterCount } from "@/hooks/use-character-count";
import { cn } from "@/lib/utils";
import type { MediaState } from "@/lib/types";

interface TweetEditorProps {
  value: string;
  onChange: (value: string) => void;
  position: number;
  onRemove?: () => void;
  showRemove?: boolean;
  media: MediaState[];
  onMediaChange: (media: MediaState[]) => void;
  mediaDisabled?: boolean;
}

export function TweetEditor({
  value,
  onChange,
  position,
  onRemove,
  showRemove = false,
  media,
  onMediaChange,
  mediaDisabled = false,
}: TweetEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const { remaining, isOver } = useCharacterCount(value);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <div className="relative rounded-lg border bg-card">
      {/* Position indicator */}
      {position > 0 && (
        <span className="absolute top-2 left-3 text-xs font-medium text-muted-foreground">
          {position}
        </span>
      )}

      {/* Remove button */}
      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          type="button"
        >
          <X className="size-3.5" />
          <span className="sr-only">Remove tweet</span>
        </Button>
      )}

      {/* Textarea */}
      <div className="p-4 pb-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInput={adjustHeight}
          placeholder="What's happening?"
          className={cn(
            "min-h-[80px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0",
            position > 0 && "pt-4"
          )}
          rows={1}
        />
      </div>

      {/* Inline media (inside card) */}
      <div className="px-4">
        <MediaUpload
          media={media}
          onChange={onMediaChange}
          disabled={mediaDisabled}
          inline
          triggerRef={mediaInputRef}
        />
      </div>

      {/* Toolbar: media button + AI assist + character counter */}
      <div className="flex items-center justify-between border-t px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-primary"
            onClick={() => mediaInputRef.current?.click()}
            disabled={mediaDisabled}
            type="button"
          >
            <ImagePlus className="size-4" />
            <span className="sr-only">Add media</span>
          </Button>
          <AiAssist text={value} onAccept={onChange} />
        </div>
        <span
          className={cn(
            "text-xs font-medium",
            isOver
              ? "text-destructive"
              : remaining <= 20
                ? "text-yellow-500"
                : "text-muted-foreground"
          )}
        >
          {remaining}
        </span>
      </div>
    </div>
  );
}
