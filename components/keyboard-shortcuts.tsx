"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createNoteAction } from "@/lib/actions/notes";

export function KeyboardShortcuts() {
  const router = useRouter();
  const creating = useRef(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing) return;

      if (event.key === "/") {
        event.preventDefault();
        router.push("/search");
      }
      if (event.key === "n" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        if (creating.current) return;
        creating.current = true;
        void Promise.resolve(createNoteAction()).finally(() => {
          creating.current = false;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
