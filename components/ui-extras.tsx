import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function VisibilityBadge({
  visibility,
  className,
}: {
  visibility: "PRIVATE" | "SHARED";
  className?: string;
}) {
  if (visibility === "SHARED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium text-primary",
          className,
        )}
      >
        <Heart className="size-3 fill-current" /> Shared
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground",
        className,
      )}
    >
      🔒 Private
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="mt-2 max-w-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground transition hover:text-foreground"
    >
      ← {label}
    </Link>
  );
}
