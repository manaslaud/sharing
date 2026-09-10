import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatLongDate } from "@/lib/dates";

type Member = {
  userId: string;
  role: "OWNER" | "MEMBER";
  joinedAt: Date;
  name: string;
  email: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function SpaceDetails({
  spaceName,
  createdAt,
  currentUserId,
  currentRole,
  members,
  stats,
  children,
}: {
  spaceName: string;
  createdAt: Date;
  currentUserId: string;
  currentRole: "OWNER" | "MEMBER";
  members: Member[];
  stats: {
    notes: number;
    journal: number;
    events: number;
    reminders: number;
  };
  children?: React.ReactNode;
}) {
  const hasPartner = members.some((member) => member.userId !== currentUserId);

  return (
    <section className="rounded-3xl border bg-card p-5">
      <h2 className="font-serif text-xl">Space</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Details for this shared space.
      </p>

      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="font-medium text-right">{spaceName}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Created</dt>
          <dd>{formatLongDate(createdAt)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Your role</dt>
          <dd>{currentRole === "OWNER" ? "Owner" : "Member"}</dd>
        </div>
      </dl>

      <h3 className="mt-6 text-sm font-medium">People</h3>
      <ul className="mt-3 grid gap-3">
        {members.map((member) => {
          const isYou = member.userId === currentUserId;
          return (
            <li key={member.userId} className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{initials(member.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {member.name}
                  {isYou ? (
                    <span className="text-muted-foreground"> (you)</span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {member.email ?? "No email"} · Joined{" "}
                  {formatLongDate(member.joinedAt)}
                </p>
              </div>
              <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
                {member.role === "OWNER" ? "Owner" : "Member"}
              </Badge>
            </li>
          );
        })}
      </ul>
      {hasPartner ? null : (
        <p className="mt-3 text-sm text-muted-foreground">
          You&apos;re here alone. Share the invite code below so one other
          person can join.
        </p>
      )}

      <h3 className="mt-6 text-sm font-medium">Shared together</h3>
      <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <li className="rounded-2xl bg-muted/50 px-3 py-2">
          {countLabel(stats.notes, "note", "notes")}
        </li>
        <li className="rounded-2xl bg-muted/50 px-3 py-2">
          {countLabel(stats.journal, "journal entry", "journal entries")}
        </li>
        <li className="rounded-2xl bg-muted/50 px-3 py-2">
          {countLabel(stats.events, "event", "events")}
        </li>
        <li className="rounded-2xl bg-muted/50 px-3 py-2">
          {countLabel(stats.reminders, "reminder", "reminders")}
        </li>
      </ul>

      {children}
    </section>
  );
}
