"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createNoteAction } from "@/lib/actions/notes";
import { ensureJournalEntryAction } from "@/lib/actions/journal";
import { ReminderDialog } from "@/components/reminders/reminder-dialog";
import { EventDialog } from "@/components/events/event-dialog";

export function QuickCreate({
  partner,
}: {
  partner?: { id: string; name: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="fixed right-4 bottom-20 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:right-8 md:bottom-8"
          aria-label="Create"
        >
          <Plus className="size-6" />
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl md:hidden">
          <SheetHeader>
            <SheetTitle>Create</SheetTitle>
          </SheetHeader>
          <CreateActions
            onClose={() => setOpen(false)}
            onReminder={() => {
              setOpen(false);
              setReminderOpen(true);
            }}
            onEvent={() => {
              setOpen(false);
              setEventOpen(true);
            }}
          />
        </SheetContent>
      </Sheet>
      <div className="fixed right-8 bottom-8 z-50 hidden md:block">
        <Sheet>
          <SheetTrigger
            className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
            aria-label="Create"
          >
            <Plus className="size-6" />
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create</SheetTitle>
            </SheetHeader>
            <CreateActions
              onReminder={() => setReminderOpen(true)}
              onEvent={() => setEventOpen(true)}
            />
          </SheetContent>
        </Sheet>
      </div>
      <ReminderDialog
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        partner={partner ?? null}
      />
      <EventDialog open={eventOpen} onOpenChange={setEventOpen} />
    </>
  );
}

function CreateActions({
  onClose,
  onReminder,
  onEvent,
}: {
  onClose?: () => void;
  onReminder: () => void;
  onEvent: () => void;
}) {
  return (
    <div className="grid gap-2 p-4">
      <Button
        size="lg"
        className="justify-start"
        onClick={() => {
          onClose?.();
          createNoteAction();
        }}
      >
        New Note
      </Button>
      <Button
        size="lg"
        variant="secondary"
        className="justify-start"
        onClick={() => {
          onClose?.();
          ensureJournalEntryAction(format(new Date(), "yyyy-MM-dd"));
        }}
      >
        New Journal Entry
      </Button>
      <Button
        size="lg"
        variant="secondary"
        className="justify-start"
        onClick={onReminder}
      >
        New Reminder
      </Button>
      <Button
        size="lg"
        variant="secondary"
        className="justify-start"
        onClick={onEvent}
      >
        New Event
      </Button>
    </div>
  );
}
