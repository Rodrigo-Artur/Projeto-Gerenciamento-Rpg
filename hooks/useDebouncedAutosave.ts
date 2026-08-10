"use client";

import { useEffect, useRef, useState } from "react";

export type AutosaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function useDebouncedAutosave<T>(
  value: T,
  save: (value: T) => Promise<unknown>,
  delay = 900,
  enabled = true
) {
  const first = useRef(true);
  const saveRef = useRef(save);
  const [state, setState] = useState<AutosaveState>("idle");

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (!enabled) return;
    if (first.current) {
      first.current = false;
      return;
    }

    setState("dirty");
    const timer = window.setTimeout(async () => {
      setState("saving");
      try {
        await saveRef.current(value);
        setState("saved");
      } catch {
        setState("error");
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [delay, enabled, value]);

  return state;
}
