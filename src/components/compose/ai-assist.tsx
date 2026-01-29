"use client";

import { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  MessageSquareText,
  Zap,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { COMPOSE_TIPS, AI_ACTION_DESCRIPTIONS } from "@/lib/x-principles";

interface AiAssistProps {
  text: string;
  onAccept: (text: string) => void;
}

type AiAction = "rewrite" | "improve" | "shorter" | "longer" | "thread" | "optimize";

const AI_ACTIONS: { action: AiAction; label: string; icon: typeof Sparkles }[] = [
  { action: "improve", label: "Improve", icon: Sparkles },
  { action: "rewrite", label: "Rewrite", icon: RefreshCw },
  { action: "shorter", label: "Make shorter", icon: ArrowDown },
  { action: "longer", label: "Make longer", icon: ArrowUp },
  { action: "thread", label: "Generate thread", icon: MessageSquareText },
  { action: "optimize", label: "Optimize for Algorithm", icon: Zap },
];

export function AiAssist({ text, onAccept }: AiAssistProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleAction(action: AiAction) {
    if (!text.trim()) return;
    setIsLoading(true);
    setSuggestion(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 403) {
          toast.error(err.error || "Add your OpenAI API key in Settings");
          setOpen(false);
          return;
        }
        throw new Error(err.error || "AI request failed");
      }

      const data = await res.json();
      setSuggestion(data.result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI request failed";
      toast.error(message);
      setSuggestion(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAccept() {
    if (suggestion) {
      onAccept(suggestion);
      setSuggestion(null);
      setOpen(false);
    }
  }

  function handleReject() {
    setSuggestion(null);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="gap-1.5 text-muted-foreground"
              disabled={!text.trim()}
            >
              <Sparkles className="size-3.5" />
              AI Assist
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="max-w-[220px]">{COMPOSE_TIPS.aiAssist}</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80 p-2" align="start">
        {suggestion ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              AI Suggestion
            </p>
            <div className="max-h-48 overflow-auto rounded-md border bg-muted/30 p-3">
              <p className="whitespace-pre-wrap text-sm">{suggestion}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAccept} className="gap-1.5 flex-1">
                <Check className="size-3.5" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReject}
                className="gap-1.5 flex-1"
              >
                <X className="size-3.5" />
                Reject
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-0.5">
            {AI_ACTIONS.map(({ action, label, icon: Icon }) => (
              <button
                key={action}
                onClick={() => handleAction(action)}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <div className="text-left">
                  <span className="font-medium">{label}</span>
                  {AI_ACTION_DESCRIPTIONS[action] && (
                    <p className="text-[11px] leading-tight text-muted-foreground">
                      {AI_ACTION_DESCRIPTIONS[action]}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
