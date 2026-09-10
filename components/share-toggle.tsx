"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { firstName } from "@/lib/names";
import { shareNoteAction } from "@/lib/actions/notes";
import { shareJournalAction } from "@/lib/actions/journal";

export function ShareToggle({
  id,
  kind,
  visibility,
  partnerName,
}: {
  id: string;
  kind: "note" | "journal";
  visibility: "PRIVATE" | "SHARED";
  partnerName?: string | null;
}) {
  const shared = visibility === "SHARED";
  const who = firstName(partnerName);
  const label = shared ? `Shared with ${who} ❤️` : `Share with ${who}`;
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={shared ? "secondary" : "outline"}
      size="sm"
      loading={pending}
      onClick={() =>
        startTransition(() => {
          void (kind === "note"
            ? shareNoteAction(id, !shared)
            : shareJournalAction(id, !shared));
        })
      }
    >
      {shared ? "❤️ " : "🔒 "}
      {label}
    </Button>
  );
}
