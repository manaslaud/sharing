"use client";

import { useState } from "react";
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
import { toast } from "sonner";

type Partner = { id: string; name: string } | null;

export function ReminderDialog({
  open,
  onOpenChange,
  partner,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: Partner;
}) {
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const dueLocal = String(formData.get("dueAt") ?? "");
    const assigned = String(formData.get("assignedTo") ?? "me");
    const shared = assigned !== "personal";
    const result = await createReminderAction({
      title: formData.get("title"),
      description: formData.get("description") || null,
      dueAt: dueLocal ? new Date(dueLocal) : new Date(),
      shared,
      assignedToId:
        assigned === "partner" && partner
          ? partner.id
          : assigned === "both"
            ? null
            : undefined,
      recurrence: formData.get("recurrence") || "NONE",
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error ?? "Couldn't save reminder");
      return;
    }
    toast.success("Reminder saved");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reminder</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Discuss vacation plans" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Notes</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dueAt">When</Label>
            <Input id="dueAt" name="dueAt" type="datetime-local" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="assignedTo">Who</Label>
            <select
              id="assignedTo"
              name="assignedTo"
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              defaultValue="personal"
            >
              <option value="personal">Just me</option>
              <option value="me">Shared · me</option>
              {partner ? <option value="partner">Shared · {partner.name}</option> : null}
              <option value="both">Shared · both of us</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="recurrence">Repeat</Label>
            <select
              id="recurrence"
              name="recurrence"
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              defaultValue="NONE"
            >
              <option value="NONE">Does not repeat</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
