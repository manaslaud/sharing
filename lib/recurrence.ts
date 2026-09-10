import { addDays, addMonths, addWeeks, addYears } from "date-fns";

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

export function snoozeUntil(from: Date, hours = 1) {
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}
