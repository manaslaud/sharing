"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createReminderAction } from "@/lib/actions/reminders";
import { usePendingAction } from "@/lib/use-pending-action";
import { toast } from "sonner";

export function ReminderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { pending, run } = usePendingAction();

  function onSubmit(formData: FormData) {
    run(async () => {
      const dueLocal = String(formData.get("dueAt") ?? "");
      const shared = String(formData.get("assignedTo") ?? "personal") === "both";
      const result = await createReminderAction({
        title: formData.get("title"),
        description: formData.get("description") || null,
        dueAt: dueLocal ? new Date(dueLocal) : new Date(),
        shared,
        assignedToId: shared ? null : undefined,
        recurrence: formData.get("recurrence") || "NONE",
      });
      if (!result.ok) {
        toast.error(result.error ?? "Couldn't save reminder");
        return;
      }
      toast.success("Reminder saved");
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>Reminder</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Discuss vacation plans" disabled={pending} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Notes</Label>
            <Textarea id="description" name="description" rows={3} disabled={pending} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dueAt">When</Label>
            <Input id="dueAt" name="dueAt" type="datetime-local" required disabled={pending} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="assignedTo">Who</Label>
            <select
              id="assignedTo"
              name="assignedTo"
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm disabled:opacity-50"
              defaultValue="personal"
              disabled={pending}
            >
              <option value="personal">Just me</option>
              <option value="both">Both of us</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="recurrence">Repeat</Label>
            <select
              id="recurrence"
              name="recurrence"
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm disabled:opacity-50"
              defaultValue="NONE"
              disabled={pending}
            >
              <option value="NONE">Does not repeat</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" loading={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
