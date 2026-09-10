"use client";

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

  return (
    <Button
      type="button"
      variant={shared ? "secondary" : "outline"}
      size="sm"
      onClick={() =>
        kind === "note"
          ? shareNoteAction(id, !shared)
          : shareJournalAction(id, !shared)
      }
    >
      {shared ? "❤️ " : "🔒 "}
      {label}
    </Button>
  );
}
