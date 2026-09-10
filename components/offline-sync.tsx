"use client";

import { useEffect } from "react";
import { updateJournalAction } from "@/lib/actions/journal";
import { updateNoteAction } from "@/lib/actions/notes";
import { readQueue, removeJob } from "@/lib/offline";

export function OfflineSync() {
  useEffect(() => {
    async function flush() {
      if (!navigator.onLine) return;
      const jobs = await readQueue();
      for (const job of jobs) {
        try {
          const result =
            job.kind === "note"
              ? await updateNoteAction(job.payload)
              : await updateJournalAction(job.payload);
          if (result.ok) {
            await removeJob(job.id);
          }
        } catch {
          break;
        }
      }
    }

    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);

  return null;
}
