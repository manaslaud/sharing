"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { createNoteAction } from "@/lib/actions/notes";
import { ensureJournalEntryAction } from "@/lib/actions/journal";

export function HomeQuickActions() {
  const [notePending, startNote] = useTransition();
  const [journalPending, startJournal] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        loading={notePending}
        onClick={() =>
          startNote(() => {
            void createNoteAction();
          })
        }
      >
        + New Note
      </Button>
      <Button
        size="sm"
        variant="secondary"
        loading={journalPending}
        onClick={() =>
          startJournal(() => {
            void ensureJournalEntryAction(format(new Date(), "yyyy-MM-dd"));
          })
        }
      >
        + Journal
      </Button>
    </div>
  );
}
