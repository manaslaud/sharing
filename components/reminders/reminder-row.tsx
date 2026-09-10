"use client";

import { completeReminderAction, snoozeReminderAction } from "@/lib/actions/reminders";
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
  const busy = completing || snoozing;

  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
      <div>
        <p className="font-medium">🔔 {reminder.title}</p>
        <p className="text-sm text-muted-foreground">
          {formatNoteTime(reminder.dueAt)}
          {reminder.sharedSpaceId ? " · Shared" : ""}
        </p>
      </div>
      <div className="flex gap-1">
        <Button
          size="xs"
          variant="secondary"
          loading={completing}
          disabled={busy}
          onClick={() => runComplete(() => completeReminderAction(reminder.id))}
        >
          {completing ? "Completing…" : "Complete"}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          loading={snoozing}
          disabled={busy}
          onClick={() => runSnooze(() => snoozeReminderAction(reminder.id))}
        >
          {snoozing ? "Snoozing…" : "Snooze"}
        </Button>
      </div>
    </div>
  );
}
