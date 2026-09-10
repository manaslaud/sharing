"use client";

import { useCallback, useRef, useTransition } from "react";

export function usePendingAction() {
  const [pending, startTransition] = useTransition();
  const locked = useRef(false);

  const run = useCallback((action: () => void | Promise<unknown>) => {
    if (locked.current) return;
    locked.current = true;
    startTransition(async () => {
      try {
        await action();
      } finally {
        locked.current = false;
      }
    });
  }, []);

  return { pending, run } as const;
}
