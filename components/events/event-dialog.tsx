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
import { createEventAction } from "@/lib/actions/events";
import { toast } from "sonner";

export function EventDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const startAt = String(formData.get("startAt") ?? "");
    const endAt = String(formData.get("endAt") ?? "");
    const result = await createEventAction({
      title: formData.get("title"),
      description: formData.get("description") || null,
      startAt: startAt ? new Date(startAt) : new Date(),
      endAt: endAt ? new Date(endAt) : null,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error ?? "Couldn't save event");
      return;
    }
    toast.success("Event saved");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Event</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="event-title">Title</Label>
            <Input id="event-title" name="title" required placeholder="Dinner" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="event-description">Description</Label>
            <Textarea id="event-description" name="description" rows={3} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="startAt">Starts</Label>
            <Input id="startAt" name="startAt" type="datetime-local" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="endAt">Ends</Label>
            <Input id="endAt" name="endAt" type="datetime-local" />
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
