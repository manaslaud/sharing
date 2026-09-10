"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { createNoteAction } from "@/lib/actions/notes";
import { ensureJournalEntryAction } from "@/lib/actions/journal";
import { usePendingAction } from "@/lib/use-pending-action";

export function HomeQuickActions() {
  const { pending: notePending, run: runNote } = usePendingAction();
  const { pending: journalPending, run: runJournal } = usePendingAction();
  const busy = notePending || journalPending;

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        loading={notePending}
        disabled={busy}
        onClick={() => runNote(() => createNoteAction())}
      >
        {notePending ? "Creating…" : "+ New Note"}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        loading={journalPending}
        disabled={busy}
        onClick={() =>
          runJournal(() => ensureJournalEntryAction(format(new Date(), "yyyy-MM-dd")))
        }
      >
        {journalPending ? "Opening…" : "+ Journal"}
      </Button>
    </div>
  );
}
