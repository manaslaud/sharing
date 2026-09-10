"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSpaceAction,
  joinSpaceAction,
  type SpaceState,
} from "@/lib/actions/space";

export function OnboardingForms() {
  const [createState, create, creating] = useActionState(
    createSpaceAction,
    {} as SpaceState,
  );
  const [joinState, join, joining] = useActionState(
    joinSpaceAction,
    {} as SpaceState,
  );

  return (
    <div className="grid gap-8">
      <form action={create} className="grid gap-3 rounded-3xl border bg-card p-5">
        <h2 className="font-serif text-xl">Create a space</h2>
        <p className="text-sm text-muted-foreground">
          Start a private shared space, then invite someone with a code.
        </p>
        <Label htmlFor="name">Space name</Label>
        <Input id="name" name="name" defaultValue="Shared Space" className="h-10" />
        {createState.fieldErrors?.name?.[0] ? (
          <p className="text-xs text-destructive">{createState.fieldErrors.name[0]}</p>
        ) : null}
        {createState.error ? (
          <p className="text-sm text-destructive">{createState.error}</p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" loading={creating}>
          {creating ? "Creating…" : "Create space"}
        </Button>
      </form>

      <form action={join} className="grid gap-3 rounded-3xl border bg-card p-5">
        <h2 className="font-serif text-xl">Join with a code</h2>
        <p className="text-sm text-muted-foreground">
          If someone already started a space, enter their invite code.
        </p>
        <Label htmlFor="inviteCode">Invite code</Label>
        <Input
          id="inviteCode"
          name="inviteCode"
          placeholder="ABCD2345"
          className="h-10 uppercase tracking-[0.2em]"
        />
        {joinState.fieldErrors?.inviteCode?.[0] ? (
          <p className="text-xs text-destructive">
            {joinState.fieldErrors.inviteCode[0]}
          </p>
        ) : null}
        {joinState.error ? (
          <p className="text-sm text-destructive">{joinState.error}</p>
        ) : null}
        <Button
          type="submit"
          size="lg"
          variant="secondary"
          className="w-full"
          loading={joining}
        >
          {joining ? "Joining…" : "Join space"}
        </Button>
      </form>
    </div>
  );
}
