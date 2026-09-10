"use client";

import { Button } from "@/components/ui/button";
import { firstName } from "@/lib/names";
import { shareNoteAction } from "@/lib/actions/notes";
import { shareJournalAction } from "@/lib/actions/journal";
import { usePendingAction } from "@/lib/use-pending-action";

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
  const { pending, run } = usePendingAction();

  return (
    <Button
      type="button"
      variant={shared ? "secondary" : "outline"}
      size="sm"
      loading={pending}
      onClick={() =>
        run(() =>
          kind === "note"
            ? shareNoteAction(id, !shared)
            : shareJournalAction(id, !shared),
        )
      }
    >
      {pending ? "Updating…" : `${shared ? "❤️ " : "🔒 "}${label}`}
    </Button>
  );
}
