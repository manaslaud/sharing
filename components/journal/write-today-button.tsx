"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ensureJournalEntryAction } from "@/lib/actions/journal";

export function WriteTodayButton({ label = "Write today" }: { label?: string }) {
  return (
    <Button
      type="button"
      onClick={() => ensureJournalEntryAction(format(new Date(), "yyyy-MM-dd"))}
    >
      {label}
    </Button>
  );
}
