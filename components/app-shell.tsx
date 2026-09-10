"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Heart,
  Home,
  NotebookPen,
  Search,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickCreate } from "@/components/quick-create";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

const mainNav: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

const desktopExtra: NavItem[] = [
  { href: "/shared", label: "Shared", icon: Heart },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/search", label: "Search", icon: Search },
];

export function AppShell({
  spaceName,
  unreadCount,
  pinned,
  recent,
  children,
}: {
  spaceName: string;
  unreadCount: number;
  pinned: { id: string; title: string }[];
  recent: { id: string; title: string; href: string }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideChrome =
    /^\/notes\/[^/]+$/.test(pathname) ||
    /^\/journal\/\d{4}-\d{2}-\d{2}$/.test(pathname);

  return (
    <div className="min-h-dvh bg-background">
      <KeyboardShortcuts />
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex md:flex-col">
        <Link href="/" className="mb-8 flex items-center gap-2 px-2">
          <Heart className="size-5 fill-primary text-primary" />
          <span className="font-serif text-xl">{spaceName}</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {[...mainNav, ...desktopExtra].map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href)
              }
              badge={item.href === "/notifications" ? unreadCount : 0}
            />
          ))}
          <div className="my-4 h-px bg-sidebar-border" />
          {pinned.length > 0 && (
            <div className="px-2 pb-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pinned
              </p>
              {pinned.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="block truncate rounded-lg px-2 py-1.5 text-sm hover:bg-sidebar-accent"
                >
                  ⭐ {note.title || "Untitled"}
                </Link>
              ))}
            </div>
          )}
          {recent.length > 0 && (
            <div className="px-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recent
              </p>
              {recent.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block truncate rounded-lg px-2 py-1.5 text-sm hover:bg-sidebar-accent"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          )}
        </nav>
        <Link
          href="/settings"
          className="mt-auto flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-sidebar-accent"
        >
          <Settings className="size-4" /> Settings
        </Link>
      </aside>

      <div className={cn("min-w-0 md:pl-64", hideChrome ? "" : "pb-24 md:pb-0")}>
        {!hideChrome && (
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur md:hidden">
            <div className="mx-auto flex w-full max-w-3xl items-center justify-end gap-1 px-2 py-2">
              <Link href="/search" className="rounded-full p-2 text-muted-foreground">
                <Search className="size-5" />
              </Link>
              <Link href="/notifications" className="relative rounded-full p-2 text-muted-foreground">
                <Bell className="size-5" />
                {unreadCount > 0 ? (
                  <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
                ) : null}
              </Link>
              <Link href="/settings" className="rounded-full p-2 text-muted-foreground">
                <Settings className="size-5" />
              </Link>
            </div>
          </header>
        )}
        <main className={cn(hideChrome ? "" : "mx-auto w-full min-w-0 max-w-3xl overflow-x-clip px-4 py-6 md:px-8 md:py-8")}>
          {children}
        </main>
      </div>

      {!hideChrome && (
        <>
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
            <div className="grid grid-cols-4 px-2 py-2">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl py-1 text-[11px]",
                    (item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href))
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
          <QuickCreate />
        </>
      )}
    </div>
  );
}

function NavLink({
  item,
  active,
  badge,
}: {
  item: NavItem;
  active: boolean;
  badge: number;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent/70",
      )}
    >
      <item.icon className="size-4" />
      <span className="flex-1">{item.label}</span>
      {badge > 0 ? (
        <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
