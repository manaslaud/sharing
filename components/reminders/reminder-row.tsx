"use client";

import { completeReminderAction, snoozeReminderAction } from "@/lib/actions/reminders";
import { formatNoteTime } from "@/lib/dates";
import { Button } from "@/components/ui/button";

type Reminder = {
  id: string;
  title: string;
  dueAt: Date;
  sharedSpaceId: string | null;
};

export function ReminderRow({ reminder }: { reminder: Reminder }) {
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
          onClick={() => completeReminderAction(reminder.id)}
        >
          Complete
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => snoozeReminderAction(reminder.id)}
        >
          Snooze
        </Button>
      </div>
    </div>
  );
}
