"use client";

import { useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCharacterCount } from "@/hooks/use-character-count";
import { cn } from "@/lib/utils";

interface TweetEditorProps {
  value: string;
  onChange: (value: string) => void;
  position: number;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function TweetEditor({
  value,
  onChange,
  position,
  onRemove,
  showRemove = false,
}: TweetEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    <div className="relative rounded-lg border bg-card p-4">
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

      {/* Character counter */}
      <div className="mt-2 flex justify-end">
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
