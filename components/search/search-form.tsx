"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const filters = ["all", "notes", "journal", "shared", "private"] as const;

function searchHref(q: string, filter: string, tag?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (filter && filter !== "all") params.set("filter", filter);
  if (tag) params.set("tag", tag);
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export function SearchForm({
  q,
  filter,
  tag,
  children,
}: {
  q: string;
  filter: string;
  tag?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const currentQuery = () => inputRef.current?.value.trim() ?? q;

  const navigate = (href: string) => {
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <>
      <form
        className="mb-4 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          navigate(searchHref(currentQuery(), filter, tag));
        }}
      >
        <div className="relative">
          <input
            ref={inputRef}
            name="q"
            defaultValue={q}
            placeholder="Search notes, tags, and journal…"
            className="h-11 w-full rounded-xl border border-input bg-card px-3 pr-10"
            aria-busy={pending}
          />
          {pending ? (
            <Loader2
              className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => {
            const active = filter === item;
            return (
              <button
                key={item}
                type="button"
                disabled={pending}
                aria-pressed={active}
                onClick={() => navigate(searchHref(currentQuery(), item, tag))}
                className={`rounded-full px-3 py-1 text-sm capitalize ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
        <button type="submit" className="sr-only" disabled={pending}>
          Search
        </button>
      </form>
      <div className="relative" aria-busy={pending || undefined}>
        {pending ? (
          <p className="sr-only" aria-live="polite">
            Searching…
          </p>
        ) : null}
        {pending ? (
          <div className="absolute inset-0 z-10 flex justify-center bg-background/60 pt-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : null}
        <div className={pending ? "pointer-events-none opacity-50" : undefined}>
          {children}
        </div>
      </div>
    </>
  );
}
