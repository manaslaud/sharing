"use client";

import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ensureJournalEntryAction } from "@/lib/actions/journal";

export function JournalDateNav({
  date,
  datesWithEntries,
}: {
  date: string;
  datesWithEntries: string[];
}) {
  const current = parseISO(`${date}T00:00:00`);
  const marked = new Set(datesWithEntries);
  const prev = format(addDays(current, -1), "yyyy-MM-dd");
  const next = format(addDays(current, 1), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" render={<Link href={`/journal/${prev}`} />}>
        Previous
      </Button>
      <Button size="sm" variant="outline" render={<Link href={`/journal/${today}`} />}>
        Today
      </Button>
      <Button size="sm" variant="outline" render={<Link href={`/journal/${next}`} />}>
        Next
      </Button>
      <Popover>
        <PopoverTrigger render={<Button size="sm" variant="secondary" />}>
          <CalendarDays className="size-4" />
          Jump to date
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <Calendar
            mode="single"
            selected={current}
            onSelect={(value) => {
              if (!value) return;
              const nextDate = format(value, "yyyy-MM-dd");
              window.location.href = `/journal/${nextDate}`;
            }}
            modifiers={{
              hasEntry: (day) => marked.has(format(day, "yyyy-MM-dd")),
            }}
            modifiersClassNames={{
              hasEntry: "bg-primary/15 font-semibold",
            }}
          />
        </PopoverContent>
      </Popover>
      <Button
        size="sm"
        onClick={() => ensureJournalEntryAction(date)}
      >
        Write this day
      </Button>
    </div>
  );
}
