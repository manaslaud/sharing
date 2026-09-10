"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ensureJournalEntryAction } from "@/lib/actions/journal";
import { usePendingAction } from "@/lib/use-pending-action";

export function WriteTodayButton({ label = "Write today" }: { label?: string }) {
  const { pending, run } = usePendingAction();

  return (
    <Button
      type="button"
      loading={pending}
      onClick={() =>
        run(() => ensureJournalEntryAction(format(new Date(), "yyyy-MM-dd")))
      }
    >
      {pending ? "Opening…" : label}
    </Button>
  );
}
