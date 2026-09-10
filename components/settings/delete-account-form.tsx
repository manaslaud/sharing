"use client";

import { useActionState, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteAccountAction,
  type DeleteAccountState,
} from "@/lib/actions/account";
import { firstName } from "@/lib/names";

export function DeleteAccountForm({
  email,
  partnerName,
  compact = false,
}: {
  email: string;
  partnerName: string | null;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    deleteAccountAction,
    {} as DeleteAccountState,
  );
  const partner = partnerName ? firstName(partnerName) : null;

  return (
    <section
      className={
        compact
          ? undefined
          : "rounded-3xl border border-destructive/20 bg-card p-5"
      }
    >
      {compact ? null : (
        <>
          <h2 className="font-serif text-xl text-destructive">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently delete your account and private data. This cannot be
            undone.
          </p>
        </>
      )}
      <Button
        type="button"
        variant={compact ? "ghost" : "destructive"}
        size={compact ? "sm" : "default"}
        className={compact ? "text-muted-foreground" : "mt-4"}
        onClick={() => setOpen(true)}
      >
        Delete account
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              {partner
                ? `${partner} keeps the shared space, shared notes, and shared journal entries. Your private notes, journal, reminders, and login are removed, and the invite code is refreshed.`
                : "This permanently deletes your space, notes, journal, reminders, events, and login. You can create a new account with the same email later."}
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" action={action}>
            <div className="grid gap-1.5">
              <Label htmlFor="delete-email">Type {email} to confirm</Label>
              <Input
                id="delete-email"
                name="email"
                type="email"
                autoComplete="off"
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="delete-password">Password</Label>
              <Input
                id="delete-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={pending}
              />
            </div>
            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" loading={pending}>
                {pending ? "Deleting…" : "Delete forever"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
