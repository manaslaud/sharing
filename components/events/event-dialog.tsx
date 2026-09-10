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
import { createEventAction } from "@/lib/actions/events";
import { usePendingAction } from "@/lib/use-pending-action";
import { toast } from "sonner";

export function EventDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { pending, run } = usePendingAction();

  function onSubmit(formData: FormData) {
    run(async () => {
      const startAt = String(formData.get("startAt") ?? "");
      const endAt = String(formData.get("endAt") ?? "");
      const result = await createEventAction({
        title: formData.get("title"),
        description: formData.get("description") || null,
        startAt: startAt ? new Date(startAt) : new Date(),
        endAt: endAt ? new Date(endAt) : null,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Couldn't save event");
        return;
      }
      toast.success("Event saved");
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
          <DialogTitle>Event</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="event-title">Title</Label>
            <Input id="event-title" name="title" required placeholder="Dinner" disabled={pending} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="event-description">Description</Label>
            <Textarea id="event-description" name="description" rows={3} disabled={pending} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="startAt">Starts</Label>
            <Input id="startAt" name="startAt" type="datetime-local" required disabled={pending} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="endAt">Ends</Label>
            <Input id="endAt" name="endAt" type="datetime-local" disabled={pending} />
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
