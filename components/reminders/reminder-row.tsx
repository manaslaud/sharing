"use client";

import { Trash2 } from "lucide-react";
import { deleteReminderAction } from "@/lib/actions/reminders";
import { formatNoteTime } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { ActionTooltip } from "@/components/ui/tooltip";
import { usePendingAction } from "@/lib/use-pending-action";

type Reminder = {
  id: string;
  title: string;
  dueAt: Date;
  sharedSpaceId: string | null;
};

export function ReminderRow({ reminder }: { reminder: Reminder }) {
  const { pending, run } = usePendingAction();

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className="font-medium">🔔 {reminder.title}</p>
        <p className="text-sm text-muted-foreground">
          {formatNoteTime(reminder.dueAt)}
          {reminder.sharedSpaceId ? " · Shared" : ""}
        </p>
      </div>
      <ActionTooltip label="Delete">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Delete"
          className="hover:bg-destructive/10 hover:text-destructive"
          loading={pending}
          onClick={() => run(() => deleteReminderAction(reminder.id))}
        >
          {pending ? null : <Trash2 />}
        </Button>
      </ActionTooltip>
    </div>
  );
}
