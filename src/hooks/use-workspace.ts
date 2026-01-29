"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useWorkspace() {
  const { data, error, isLoading } = useSWR("/api/workspace", fetcher);

  return {
    workspaceId: data?.workspaceId as string | null,
    isLoading,
    error,
  };
}
