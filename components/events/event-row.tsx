"use client";

import { Trash2 } from "lucide-react";
import { deleteEventAction } from "@/lib/actions/events";
import { formatNoteTime } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { usePendingAction } from "@/lib/use-pending-action";

type EventItem = {
  id: string;
  title: string;
  startAt: Date;
};

export function EventRow({ event }: { event: EventItem }) {
  const { pending, run } = usePendingAction();

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className="font-medium">📅 {event.title}</p>
        <p className="text-sm text-muted-foreground">
          {formatNoteTime(event.startAt)}
        </p>
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Delete"
        className="hover:bg-destructive/10 hover:text-destructive"
        loading={pending}
        onClick={() => run(() => deleteEventAction(event.id))}
      >
        {pending ? null : <Trash2 />}
      </Button>
    </div>
  );
}
