"use client";

import { Info } from "lucide-react";
import { AlgorithmScoreBar } from "@/components/compose/algorithm-score-bar";
import { AlgorithmTips } from "@/components/compose/algorithm-tips";

interface AlgorithmSidebarProps {
  text: string;
  hasMedia: boolean;
  threadLength: number;
  scheduledAt: Date | null;
}

export function AlgorithmSidebar({
  text,
  hasMedia,
  threadLength,
  scheduledAt,
}: AlgorithmSidebarProps) {
  const hasText = text.trim().length > 0;

  return (
    <div className="space-y-4">
      {hasText ? (
        <>
          <AlgorithmScoreBar
            text={text}
            hasMedia={hasMedia}
            threadLength={threadLength}
            variant="sidebar"
          />

          <AlgorithmTips
            text={text}
            hasMedia={hasMedia}
            threadLength={threadLength}
            scheduledAt={scheduledAt}
          />
        </>
      ) : (
        <div className="text-xs text-muted-foreground text-center py-4">
          Start typing to see your algorithm score
        </div>
      )}

      {/* Algorithm attribution banner */}
      <div className="rounded-lg border border-x-blue/20 bg-x-blue/5 px-2.5 py-2">
        <div className="flex flex-col items-center gap-1.5 text-[10px] text-center">
          <Info className="size-3 shrink-0 text-x-blue" />
          <span className="text-muted-foreground leading-relaxed">
            Scoring powered by{" "}
            <a
              href="https://github.com/xai-org/x-algorithm"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-x-blue hover:underline"
            >
              X&apos;s open-sourced algorithm
            </a>
            , engagement data &amp; creator case studies
          </span>
        </div>
      </div>
    </div>
  );
}
