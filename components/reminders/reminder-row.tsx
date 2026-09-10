"use client";

import { Check, Clock, Trash2 } from "lucide-react";
import {
  completeReminderAction,
  deleteReminderAction,
  snoozeReminderAction,
} from "@/lib/actions/reminders";
import { formatNoteTime } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { usePendingAction } from "@/lib/use-pending-action";

type Reminder = {
  id: string;
  title: string;
  dueAt: Date;
  sharedSpaceId: string | null;
};

export function ReminderRow({ reminder }: { reminder: Reminder }) {
  const { pending: completing, run: runComplete } = usePendingAction();
  const { pending: snoozing, run: runSnooze } = usePendingAction();
  const { pending: deleting, run: runDelete } = usePendingAction();
  const busy = completing || snoozing || deleting;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className="font-medium">🔔 {reminder.title}</p>
        <p className="text-sm text-muted-foreground">
          {formatNoteTime(reminder.dueAt)}
          {reminder.sharedSpaceId ? " · Shared" : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label="Complete"
          loading={completing}
          disabled={busy}
          onClick={() => runComplete(() => completeReminderAction(reminder.id))}
        >
          {completing ? null : <Check />}
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Snooze"
          loading={snoozing}
          disabled={busy}
          onClick={() => runSnooze(() => snoozeReminderAction(reminder.id))}
        >
          {snoozing ? null : <Clock />}
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Delete"
          className="hover:bg-destructive/10 hover:text-destructive"
          loading={deleting}
          disabled={busy}
          onClick={() => runDelete(() => deleteReminderAction(reminder.id))}
        >
          {deleting ? null : <Trash2 />}
        </Button>
      </div>
    </div>
  );
}
