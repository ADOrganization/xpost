"use client";

import { useState, useCallback } from "react";
import { nanoid } from "nanoid";
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ThreadItemState } from "@/lib/types";

interface AiGenerateProps {
  onGenerate: (items: ThreadItemState[]) => void;
}

type GenerateFormat = "single" | "thread";

export function AiGenerate({ onGenerate }: AiGenerateProps) {
  const [context, setContext] = useState("");
  const [format, setFormat] = useState<GenerateFormat>("single");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const action = format === "single" ? "generate_single" : "generate_thread";

  const parseResponse = useCallback(
    (result: string): ThreadItemState[] => {
      if (format === "single") {
        return [{ id: nanoid(), text: result.trim(), images: [], pollOptions: [] }];
      }

      // Thread: split on --- separator, strip numbering like "1/ " or "1. "
      return result
        .split("---")
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.length > 0)
        .map((chunk) => ({
          id: nanoid(),
          text: chunk.replace(/^\d+[/.]\s*/, ""),
          images: [],
          pollOptions: [],
        }));
    },
    [format]
  );

  const handleGenerate = useCallback(async () => {
    if (!context.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text: context }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 403) {
          toast.error(err.error || "Add your OpenAI API key in Settings");
          return;
        }
        throw new Error(err.error || "AI generation failed");
      }

      const data = await res.json();
      const items = parseResponse(data.result);
      onGenerate(items);
      setHasGenerated(true);
      setIsExpanded(false);
      toast.success(
        format === "single" ? "Tweet generated" : "Thread generated"
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "AI generation failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [context, action, format, parseResponse, onGenerate]);

  return (
    <div className="rounded-lg border bg-card">
      {/* Collapsed header / toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-accent/50"
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="size-4" />
          Generate with AI
        </span>
        {isExpanded ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded body */}
      {isExpanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3">
          {/* Context textarea */}
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Describe your topic, paste notes, or provide context..."
            rows={3}
            className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {/* Format toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormat("single")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                format === "single"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              Single Tweet
            </button>
            <button
              type="button"
              onClick={() => setFormat("thread")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                format === "thread"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              Thread
            </button>
          </div>

          {/* Generate + Cycle buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isLoading || !context.trim()}
              className="gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {isLoading ? "Generating..." : "Generate"}
            </Button>

            {hasGenerated && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                disabled={isLoading || !context.trim()}
                className="gap-1.5"
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Cycle
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
