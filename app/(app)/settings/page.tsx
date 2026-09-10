import { prisma } from "@/lib/db";
import { getSpaceContext } from "@/lib/session";
import { PageHeader } from "@/components/ui-extras";
import { logoutAction } from "@/lib/actions/auth";
import { updateProfileFormAction, rotateInviteCodeAction } from "@/lib/actions/space";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";
import { SpaceDetails } from "@/components/settings/space-details";
import { isSpaceFull } from "@/lib/space-limits";
import Link from "next/link";

export default async function SettingsPage() {
  const ctx = await getSpaceContext();
  const spaceFilter = { sharedSpaceId: ctx.space.id, deletedAt: null };
  const [
    user,
    sharedNotes,
    sharedJournal,
    sharedEvents,
    sharedReminders,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        name: true,
        email: true,
        timezone: true,
        notificationPreference: true,
      },
    }),
    prisma.note.count({
      where: { ...spaceFilter, visibility: "SHARED" },
    }),
    prisma.journalEntry.count({
      where: { ...spaceFilter, visibility: "SHARED" },
    }),
    prisma.event.count({
      where: { sharedSpaceId: ctx.space.id },
    }),
    prisma.reminder.count({
      where: spaceFilter,
    }),
  ]);
  const isOwner = ctx.membership.role === "OWNER";
  const spaceIsFull = isSpaceFull(ctx.space.members.length);

  return (
    <div className="grid min-w-0 gap-8">
      <PageHeader title="Settings" />

      <section className="rounded-3xl border bg-card p-5">
        <h2 className="font-serif text-xl">Profile</h2>
        <form action={updateProfileFormAction} className="mt-4 grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={user?.name ?? ""} />
          </div>
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue={user?.timezone ?? "UTC"}
            />
          </div>
          <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
        </form>
      </section>

      <SpaceDetails
        spaceName={ctx.space.name}
        createdAt={ctx.space.createdAt}
        currentUserId={ctx.userId}
        currentRole={ctx.membership.role}
        members={ctx.space.members.map((member) => ({
          userId: member.userId,
          role: member.role,
          joinedAt: member.createdAt,
          name: member.user.name,
          email: member.user.email,
        }))}
        stats={{
          notes: sharedNotes,
          journal: sharedJournal,
          events: sharedEvents,
          reminders: sharedReminders,
        }}
      >
        <div className="mt-6 border-t pt-5">
          <h3 className="text-sm font-medium">Invite</h3>
          {spaceIsFull ? (
            <p className="mt-1 text-sm text-muted-foreground">
              This space is limited to two people, so new invites are closed.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Share this code so one other person can join {ctx.space.name}.
              </p>
              <p className="mt-3 break-all font-mono text-2xl tracking-[0.2em]">
                {ctx.space.inviteCode}
              </p>
              {isOwner ? (
                <form action={rotateInviteCodeAction} className="mt-3">
                  <SubmitButton variant="secondary" pendingLabel="Refreshing…">
                    Refresh code
                  </SubmitButton>
                </form>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  Only the owner can refresh the invite code.
                </p>
              )}
            </>
          )}
          <Link href="/shared" className="mt-4 inline-block text-sm text-primary">
            View shared content →
          </Link>
        </div>
      </SpaceDetails>

      <section className="rounded-3xl border bg-card p-5">
        <h2 className="font-serif text-xl">Appearance</h2>
        <div className="mt-3">
          <ThemeToggle />
        </div>
      </section>

      <NotificationSettings
        initial={{
          sharedContent: user?.notificationPreference?.sharedContent ?? true,
          reminders: user?.notificationPreference?.reminders ?? true,
          events: user?.notificationPreference?.events ?? true,
          pushEnabled: user?.notificationPreference?.pushEnabled ?? false,
        }}
      />

      <form action={logoutAction}>
        <SubmitButton variant="outline" pendingLabel="Signing out…">
          Log out
        </SubmitButton>
      </form>

      <DeleteAccountForm
        email={user?.email ?? ctx.user.email ?? ""}
        partnerName={ctx.partner?.name ?? null}
      />
    </div>
  );
}
