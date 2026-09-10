"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { EventRow } from "@/components/events/event-row";
import { ReminderRow } from "@/components/reminders/reminder-row";
import { toDateParam } from "@/lib/dates";

type Marker = {
  date: string;
  journal?: boolean;
  reminder?: boolean;
  event?: boolean;
};

type DayItem =
  | { kind: "journal"; title: string; href: string; shared?: boolean }
  | {
      kind: "reminder";
      id: string;
      title: string;
      when: Date;
      sharedSpaceId: string | null;
    }
  | { kind: "event"; id: string; title: string; when: Date };

export function MonthCalendar({
  initialMonth,
  markers,
  itemsByDate,
}: {
  initialMonth: string;
  markers: Marker[];
  itemsByDate: Record<string, DayItem[]>;
}) {
  const [month, setMonth] = useState(new Date(`${initialMonth}T00:00:00`));
  const [selected, setSelected] = useState(toDateParam(new Date()));
  const markerMap = useMemo(
    () => new Map(markers.map((marker) => [marker.date, marker])),
    [markers],
  );

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  const selectedItems = itemsByDate[selected] ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl">{format(month, "MMMM yyyy")}</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            Prev
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMonth(new Date())}>
            Today
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            Next
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const key = toDateParam(day);
          const marker = markerMap.get(key);
          const inMonth = isSameMonth(day, month);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={`min-h-16 rounded-2xl border p-1 text-sm ${
                selected === key ? "border-primary bg-accent" : "bg-card"
              } ${inMonth ? "" : "opacity-40"}`}
            >
              <div>{format(day, "d")}</div>
              <div className="mt-1 flex justify-center gap-0.5 text-[10px]">
                {marker?.journal ? <span>❤️</span> : null}
                {marker?.reminder ? <span>🔔</span> : null}
                {marker?.event ? <span>📅</span> : null}
              </div>
            </button>
          );
        })}
      </div>
      <section className="mt-6">
        <h3 className="font-serif text-xl">
          {format(new Date(`${selected}T00:00:00`), "MMMM d")}
        </h3>
        <div className="mt-3 grid gap-2">
          {selectedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing on this day.</p>
          ) : (
            selectedItems.map((item, index) =>
              item.kind === "journal" ? (
                <div
                  key={`${item.kind}-${index}`}
                  className="rounded-2xl border bg-card px-4 py-3"
                >
                  <Link href={item.href}>
                    ❤️ {item.shared ? "Shared journal" : "Journal"} · {item.title}
                  </Link>
                </div>
              ) : item.kind === "reminder" ? (
                <ReminderRow
                  key={item.id}
                  reminder={{
                    id: item.id,
                    title: item.title,
                    dueAt: item.when,
                    sharedSpaceId: item.sharedSpaceId,
                  }}
                />
              ) : (
                <EventRow
                  key={item.id}
                  event={{
                    id: item.id,
                    title: item.title,
                    startAt: item.when,
                  }}
                />
              ),
            )
          )}
        </div>
      </section>
    </div>
  );
}
