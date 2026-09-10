import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";

export type RecurrenceRule = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export function nextDueAt(from: Date, recurrence: RecurrenceRule): Date | null {
  switch (recurrence) {
    case "DAILY":
      return addDays(from, 1);
    case "WEEKLY":
      return addWeeks(from, 1);
    case "MONTHLY":
      return addMonths(from, 1);
    case "YEARLY":
      return addYears(from, 1);
    default:
      return null;
  }
}

/** First occurrence after `after`, walking forward from `from`. */
export function nextOccurrence(
  from: Date,
  recurrence: RecurrenceRule,
  after: Date,
): Date | null {
  let next = nextDueAt(from, recurrence);
  if (!next) return null;
  let steps = 0;
  while (next.getTime() <= after.getTime()) {
    const following = nextDueAt(next, recurrence);
    if (!following) return next;
    next = following;
    steps += 1;
    if (steps > 4000) return next;
  }
  return next;
}

/** First occurrence at or after `at`. */
export function upcomingOccurrence(
  from: Date,
  recurrence: RecurrenceRule,
  at: Date,
  seriesStart?: Date,
): Date | null {
  const floor = seriesStart ?? from;
  if (from.getTime() >= at.getTime() && from.getTime() >= floor.getTime()) {
    return from;
  }
  const next = nextOccurrence(from, recurrence, at);
  if (next && next.getTime() >= floor.getTime()) return next;
  return null;
}

/** Last occurrence strictly before `before`. */
export function previousOccurrence(
  from: Date,
  recurrence: RecurrenceRule,
  before: Date,
  seriesStart?: Date,
): Date | null {
  const floor = seriesStart ?? from;
  if (recurrence === "NONE") {
    return from.getTime() < before.getTime() && from.getTime() >= floor.getTime()
      ? from
      : null;
  }

  if (from.getTime() < before.getTime()) {
    let cursor: Date | null =
      from.getTime() >= floor.getTime()
        ? from
        : nextOccurrence(from, recurrence, new Date(floor.getTime() - 1));
    if (!cursor || cursor.getTime() < floor.getTime() || cursor.getTime() >= before.getTime()) {
      return null;
    }
    let steps = 0;
    while (cursor && steps < 4000) {
      const following = nextDueAt(cursor, recurrence);
      if (!following || following.getTime() >= before.getTime()) return cursor;
      cursor = following;
      steps += 1;
    }
    return cursor;
  }

  let back = previousDueAt(from, recurrence);
  let steps = 0;
  while (back && steps < 4000) {
    if (back.getTime() < floor.getTime()) return null;
    if (back.getTime() < before.getTime()) return back;
    back = previousDueAt(back, recurrence);
    steps += 1;
  }
  return null;
}

export function previousDueAt(
  from: Date,
  recurrence: RecurrenceRule,
): Date | null {
  switch (recurrence) {
    case "DAILY":
      return subDays(from, 1);
    case "WEEKLY":
      return subWeeks(from, 1);
    case "MONTHLY":
      return subMonths(from, 1);
    case "YEARLY":
      return subYears(from, 1);
    default:
      return null;
  }
}

function inRange(value: Date, rangeStart: Date, rangeEnd: Date) {
  return value.getTime() >= rangeStart.getTime() && value.getTime() <= rangeEnd.getTime();
}

/** Every occurrence that falls in `[rangeStart, rangeEnd]`, aligned to `dueAt`. */
export function occurrencesInRange(
  dueAt: Date,
  recurrence: RecurrenceRule,
  rangeStart: Date,
  rangeEnd: Date,
  seriesStart?: Date,
) {
  const floor = seriesStart ?? rangeStart;
  const dates: Date[] = [];

  if (recurrence === "NONE") {
    if (inRange(dueAt, rangeStart, rangeEnd) && dueAt.getTime() >= floor.getTime()) {
      dates.push(dueAt);
    }
    return dates;
  }

  if (
    inRange(dueAt, rangeStart, rangeEnd) &&
    dueAt.getTime() >= floor.getTime()
  ) {
    dates.push(dueAt);
  }

  let steps = 0;
  let back = previousDueAt(dueAt, recurrence);
  while (back && back.getTime() >= floor.getTime() && steps < 4000) {
    if (inRange(back, rangeStart, rangeEnd)) dates.push(back);
    if (back.getTime() < rangeStart.getTime()) break;
    back = previousDueAt(back, recurrence);
    steps += 1;
  }

  let forward = nextDueAt(dueAt, recurrence);
  while (forward && steps < 4000) {
    if (forward.getTime() > rangeEnd.getTime()) break;
    if (inRange(forward, rangeStart, rangeEnd) && forward.getTime() >= floor.getTime()) {
      dates.push(forward);
    }
    forward = nextDueAt(forward, recurrence);
    steps += 1;
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
}
