"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { createNoteAction } from "@/lib/actions/notes";
import { ensureJournalEntryAction } from "@/lib/actions/journal";

export function HomeQuickActions() {
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => createNoteAction()}>
        + New Note
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() =>
          ensureJournalEntryAction(format(new Date(), "yyyy-MM-dd"))
        }
      >
        + Journal
      </Button>
    </div>
  );
}
