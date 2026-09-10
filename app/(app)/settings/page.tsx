import { prisma } from "@/lib/db";
import { getSpaceContext } from "@/lib/session";
import { PageHeader } from "@/components/ui-extras";
import { logoutAction } from "@/lib/actions/auth";
import { updateProfileFormAction, rotateInviteCodeAction } from "@/lib/actions/space";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { NotificationSettings } from "@/components/settings/notification-settings";
import Link from "next/link";

export default async function SettingsPage() {
  const ctx = await getSpaceContext();
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: {
      name: true,
      email: true,
      timezone: true,
      notificationPreference: true,
    },
  });

  return (
    <div className="grid gap-8">
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
          <Button type="submit">Save profile</Button>
        </form>
      </section>

      <section className="rounded-3xl border bg-card p-5">
        <h2 className="font-serif text-xl">Invite</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share this code so someone can join {ctx.space.name}.
        </p>
        <p className="mt-3 font-mono text-2xl tracking-[0.3em]">
          {ctx.space.inviteCode}
        </p>
        <form action={rotateInviteCodeAction} className="mt-3">
          <Button type="submit" variant="secondary">
            Refresh code
          </Button>
        </form>
        <Link href="/shared" className="mt-4 inline-block text-sm text-primary">
          View shared content →
        </Link>
      </section>

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
        <button type="submit" className={buttonVariants({ variant: "outline" })}>
          Log out
        </button>
      </form>
    </div>
  );
}
