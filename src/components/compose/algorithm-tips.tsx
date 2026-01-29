"use client";

import { useMemo } from "react";
import {
  Lightbulb,
  MessageCircle,
  Clock,
  Users,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AlgorithmTipsProps {
  text: string;
  hasMedia: boolean;
  threadLength: number;
  scheduledAt: Date | null;
}

interface Tip {
  id: string;
  icon: typeof Lightbulb;
  message: string;
  type: "boost" | "warning" | "info";
}

export function AlgorithmTips({
  text,
  hasMedia,
  threadLength,
  scheduledAt,
}: AlgorithmTipsProps) {
  const tips = useMemo(() => {
    const result: Tip[] = [];
    const trimmed = text.trim();
    if (!trimmed) return result;

    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    const hasQuestion = /\?/.test(trimmed);
    const hasReplyInvite =
      /what do you think|your thoughts|agree or disagree|hot take|unpopular opinion|change my mind|am i wrong|thoughts\?/i.test(
        trimmed
      );
    const firstLine = trimmed.split(/\n/)[0] || "";
    const firstLineWords = firstLine.split(/\s+/).filter(Boolean).length;
    const hasEngagementBait =
      /like if you|retweet if|follow me|share this|rt if/i.test(trimmed);

    // Critical warning: engagement bait
    if (hasEngagementBait) {
      result.push({
        id: "bait-warning",
        icon: ShieldAlert,
        message:
          'Engagement bait triggers "Not Interested" clicks (-148 likes each). Remove phrases like "like if" or "RT if".',
        type: "warning",
      });
    }

    // Reply optimization
    if (!hasQuestion && !hasReplyInvite) {
      result.push({
        id: "reply-prompt",
        icon: MessageCircle,
        message:
          "End with a question or invite perspectives — each reply is worth 27x a like to the algorithm.",
        type: "boost",
      });
    }

    // Dwell time
    if (wordCount < 20 && threadLength === 1 && !hasMedia) {
      result.push({
        id: "dwell-short",
        icon: Zap,
        message:
          "Short posts get scrolled past. Add substance or media — dwell time scores 22x a like.",
        type: "info",
      });
    }

    // Hook length
    if (firstLineWords > 20) {
      result.push({
        id: "hook-long",
        icon: Lightbulb,
        message:
          "Your opening line is long. Punchy hooks under 15 words drive profile clicks (24x likes).",
        type: "info",
      });
    }

    // Thread diversity decay
    if (threadLength >= 3) {
      result.push({
        id: "diversity-decay",
        icon: Users,
        message: `Thread with ${threadLength} items: tweets 3+ show at 43.75% score due to diversity decay. Put your strongest content first.`,
        type: "warning",
      });
    } else if (threadLength === 2) {
      result.push({
        id: "diversity-mild",
        icon: Users,
        message:
          "2nd tweet in thread shows at 62.5% score (diversity decay). Make sure tweet 1 carries the hook.",
        type: "info",
      });
    }

    // Schedule timing
    if (scheduledAt) {
      const hour = scheduledAt.getHours();
      const isOffPeak = hour < 7 || hour > 22;
      if (isOffPeak) {
        result.push({
          id: "timing-offpeak",
          icon: Clock,
          message:
            "Scheduled during off-peak hours. Tweets have an 8-hour half-life — posting when your audience is active maximizes the cold start window (need 16+ engagements).",
          type: "warning",
        });
      }
    }

    // Limit to top 2 most relevant tips
    return result.slice(0, 2);
  }, [text, hasMedia, threadLength, scheduledAt]);

  if (tips.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {tips.map((tip) => (
        <div
          key={tip.id}
          className={cn(
            "flex items-start gap-2 rounded-md px-3 py-2 text-xs leading-relaxed",
            tip.type === "boost" && "bg-emerald-500/5 text-emerald-400",
            tip.type === "warning" && "bg-yellow-500/5 text-yellow-400",
            tip.type === "info" && "bg-x-blue/5 text-x-blue"
          )}
        >
          <tip.icon className="size-3.5 mt-0.5 shrink-0" />
          <span>{tip.message}</span>
        </div>
      ))}
    </div>
  );
}
