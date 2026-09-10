"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ensureJournalEntryAction } from "@/lib/actions/journal";

export function WriteTodayButton({ label = "Write today" }: { label?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      loading={pending}
      onClick={() =>
        startTransition(() => {
          void ensureJournalEntryAction(format(new Date(), "yyyy-MM-dd"));
        })
      }
    >
      {label}
    </Button>
  );
}
