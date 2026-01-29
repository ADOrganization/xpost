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
    <div className="space-y-3">
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
        <p className="text-[11px] text-muted-foreground text-center py-3">
          Start typing to see score
        </p>
      )}

      <div className="rounded-md border border-x-blue/20 bg-x-blue/5 px-2 py-2">
        <div className="flex items-start gap-1.5 text-[10px] leading-relaxed">
          <Info className="size-3 shrink-0 text-x-blue mt-0.5" />
          <span className="text-muted-foreground">
            Built on{" "}
            <a
              href="https://github.com/xai-org/x-algorithm"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-x-blue hover:underline"
            >
              X&apos;s open-sourced algorithm
            </a>
            , real engagement weight data, top creator case studies &amp; growth patterns from 10K+ viral posts
          </span>
        </div>
      </div>
    </div>
  );
}
