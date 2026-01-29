"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AUTOSAVE_DEBOUNCE_MS } from "@/lib/constants";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  enabled: boolean = true
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  const initialRef = useRef(true);

  dataRef.current = data;

  const save = useCallback(async () => {
    if (!enabled) return;
    setStatus("saving");
    try {
      await saveFn(dataRef.current);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }, [saveFn, enabled]);

  useEffect(() => {
    // Skip first render
    if (initialRef.current) {
      initialRef.current = false;
      return;
    }
    if (!enabled) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(save, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, save, enabled]);

  return { status, save };
}
