"use client";

import { useMemo } from "react";
import {
  MessageCircle,
  MousePointerClick,
  Eye,
  Image,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AlgorithmScoreBarProps {
  text: string;
  hasMedia: boolean;
  threadLength: number;
  variant?: "inline" | "sidebar";
}

interface ScoreSignal {
  label: string;
  icon: typeof MessageCircle;
  active: boolean;
  tip: string;
  weight: "high" | "medium" | "low";
}

function analyzeContent(text: string, hasMedia: boolean, threadLength: number) {
  const trimmed = text.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  // Reply triggers: questions, "what do you think", controversial framing
  const hasQuestion = /\?/.test(trimmed);
  const hasReplyInvite =
    /what do you think|your thoughts|agree or disagree|hot take|unpopular opinion|change my mind|am i wrong/i.test(
      trimmed
    );
  const replyOptimized = hasQuestion || hasReplyInvite;

  // Dwell time: enough substance to read (30+ words for single, 15+ per item for thread)
  const dwellOptimized =
    threadLength > 1 ? wordCount >= 15 : wordCount >= 30;

  // Hook strength: first line is punchy (under 15 words)
  const firstLine = trimmed.split(/\n/)[0] || "";
  const firstLineWords = firstLine.split(/\s+/).filter(Boolean).length;
  const hasStrongHook = firstLineWords > 0 && firstLineWords <= 15;

  // Media boost
  const hasMediaBoost = hasMedia;

  // Thread diversity decay warning
  const diversityWarning = threadLength >= 3;

  // Overall score 0-100
  let score = 20; // baseline for having text
  if (replyOptimized) score += 30;
  if (dwellOptimized) score += 20;
  if (hasStrongHook) score += 15;
  if (hasMediaBoost) score += 15;
  if (diversityWarning) score -= 10;

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    replyOptimized,
    dwellOptimized,
    hasStrongHook,
    hasMediaBoost,
    diversityWarning,
  };
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-x-blue";
  if (score >= 30) return "text-yellow-500";
  return "text-muted-foreground";
}

function getBarColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-x-blue";
  if (score >= 30) return "bg-yellow-500";
  return "bg-muted-foreground/40";
}

function getScoreLabel(score: number): string {
  if (score >= 75) return "High reach potential";
  if (score >= 50) return "Good reach potential";
  if (score >= 30) return "Moderate reach";
  return "Low reach — optimize further";
}

export function AlgorithmScoreBar({
  text,
  hasMedia,
  threadLength,
  variant = "inline",
}: AlgorithmScoreBarProps) {
  const analysis = useMemo(
    () => analyzeContent(text, hasMedia, threadLength),
    [text, hasMedia, threadLength]
  );

  const signals: ScoreSignal[] = useMemo(
    () => [
      {
        label: "Replies",
        icon: MessageCircle,
        active: analysis.replyOptimized,
        tip: analysis.replyOptimized
          ? "Reply trigger detected — replies are worth 27x likes"
          : "Add a question or invite perspectives — replies are 27x likes",
        weight: "high",
      },
      {
        label: "Dwell",
        icon: Eye,
        active: analysis.dwellOptimized,
        tip: analysis.dwellOptimized
          ? "Good length for dwell time (22x likes)"
          : "Add more substance — dwell time is worth 22x likes",
        weight: "high",
      },
      {
        label: "Hook",
        icon: MousePointerClick,
        active: analysis.hasStrongHook,
        tip: analysis.hasStrongHook
          ? "Strong opening hook — drives profile clicks (24x likes)"
          : "First line is too long — keep hooks under 15 words for profile clicks (24x)",
        weight: "medium",
      },
      {
        label: "Media",
        icon: Image,
        active: analysis.hasMediaBoost,
        tip: analysis.hasMediaBoost
          ? "Media stops the scroll and boosts engagement"
          : "Add an image or video — media increases dwell time significantly",
        weight: "medium",
      },
      ...(analysis.diversityWarning
        ? [
            {
              label: "Decay",
              icon: AlertTriangle,
              active: true,
              tip: "3+ thread items face diversity decay (0.4375x). Front-load your best content",
              weight: "low" as const,
            },
          ]
        : []),
    ],
    [analysis]
  );

  if (!text.trim()) return null;

  if (variant === "sidebar") {
    return (
      <div className="space-y-3">
        {/* Score header */}
        <div className="space-y-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-default">
                <TrendingUp className={cn("size-3.5", getScoreColor(analysis.score))} />
                <span className={cn("text-lg font-bold tabular-nums", getScoreColor(analysis.score))}>
                  {analysis.score}
                </span>
                <span className="text-[10px] text-muted-foreground">/ 100</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="max-w-[220px] text-xs">
                Algorithm reach score based on X&apos;s real engagement weights.{" "}
                {getScoreLabel(analysis.score)}.
              </p>
            </TooltipContent>
          </Tooltip>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500 ease-out", getBarColor(analysis.score))}
              style={{ width: `${analysis.score}%` }}
            />
          </div>
          <p className={cn("text-[10px] font-medium", getScoreColor(analysis.score))}>
            {getScoreLabel(analysis.score)}
          </p>
        </div>

        {/* Signal list — vertical in sidebar */}
        <div className="space-y-1">
          {signals.map((signal) => (
            <Tooltip key={signal.label}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-default",
                    signal.active && signal.weight === "high"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : signal.active && signal.weight === "medium"
                        ? "bg-x-blue/10 text-x-blue"
                        : signal.active && signal.weight === "low"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-muted text-muted-foreground"
                  )}
                >
                  <signal.icon className="size-3 shrink-0" />
                  <span className="truncate">{signal.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="max-w-[240px] text-xs">{signal.tip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Score bar */}
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-default">
              <TrendingUp className={cn("size-3.5", getScoreColor(analysis.score))} />
              <span className={cn("text-xs font-semibold tabular-nums", getScoreColor(analysis.score))}>
                {analysis.score}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="max-w-[220px] text-xs">
              Algorithm reach score based on X&apos;s real engagement weights.{" "}
              {getScoreLabel(analysis.score)}.
            </p>
          </TooltipContent>
        </Tooltip>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500 ease-out", getBarColor(analysis.score))}
            style={{ width: `${analysis.score}%` }}
          />
        </div>
      </div>

      {/* Signal pills */}
      <div className="flex flex-wrap gap-1.5">
        {signals.map((signal) => (
          <Tooltip key={signal.label}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors cursor-default",
                  signal.active && signal.weight === "high"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : signal.active && signal.weight === "medium"
                      ? "bg-x-blue/10 text-x-blue"
                      : signal.active && signal.weight === "low"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-muted text-muted-foreground"
                )}
              >
                <signal.icon className="size-3" />
                {signal.label}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="max-w-[240px] text-xs">{signal.tip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
