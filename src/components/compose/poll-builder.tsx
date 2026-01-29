"use client";

import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MAX_POLL_OPTIONS,
  MIN_POLL_OPTIONS,
  POLL_OPTION_CHAR_LIMIT,
} from "@/lib/constants";

const POLL_DURATION_OPTIONS = [
  { label: "5 minutes", value: "5" },
  { label: "30 minutes", value: "30" },
  { label: "1 hour", value: "60" },
  { label: "6 hours", value: "360" },
  { label: "12 hours", value: "720" },
  { label: "1 day", value: "1440" },
  { label: "3 days", value: "4320" },
  { label: "7 days", value: "10080" },
] as const;

interface PollBuilderProps {
  options: string[];
  onChange: (options: string[]) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  duration: number;
  onDurationChange: (minutes: number) => void;
}

export function PollBuilder({
  options,
  onChange,
  enabled,
  onToggle,
  duration,
  onDurationChange,
}: PollBuilderProps) {
  const canAddOption = options.length < MAX_POLL_OPTIONS;
  const canRemoveOption = options.length > MIN_POLL_OPTIONS;

  function handleOptionChange(index: number, value: string) {
    const updated = options.map((opt, i) => (i === index ? value : opt));
    onChange(updated);
  }

  function handleAddOption() {
    if (!canAddOption) return;
    onChange([...options, ""]);
  }

  function handleRemoveOption(index: number) {
    if (!canRemoveOption) return;
    onChange(options.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="poll-toggle"
          className="text-sm font-medium leading-none"
        >
          Add poll
        </label>
        <Switch
          id="poll-toggle"
          checked={enabled}
          onCheckedChange={onToggle}
        />
      </div>

      {enabled && (
        <div className="space-y-3">
          {/* Notice about mutual exclusion */}
          <p className="text-xs text-muted-foreground">
            Images are disabled when a poll is active.
          </p>

          {/* Poll options */}
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    value={option}
                    onChange={(e) =>
                      handleOptionChange(index, e.target.value)
                    }
                    placeholder={`Option ${index + 1}`}
                    maxLength={POLL_OPTION_CHAR_LIMIT}
                  />
                  <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-muted-foreground">
                    {option.length}/{POLL_OPTION_CHAR_LIMIT}
                  </span>
                </div>
                {canRemoveOption && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleRemoveOption(index)}
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                    <span className="sr-only">Remove option</span>
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add option */}
          {canAddOption && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              type="button"
              className="gap-1.5 text-muted-foreground"
            >
              <Plus className="size-4" />
              Add option
            </Button>
          )}

          {/* Poll duration */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">
              Poll duration
            </label>
            <Select
              value={String(duration)}
              onValueChange={(v) => onDurationChange(Number(v))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {POLL_DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
