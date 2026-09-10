import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
} from "date-fns";

export function formatNoteTime(date: Date | string) {
  const value = typeof date === "string" ? parseISO(date) : date;
  if (isToday(value)) return format(value, "h:mm a");
  if (isTomorrow(value)) return `Tomorrow · ${format(value, "h:mm a")}`;
  if (isYesterday(value)) return `Yesterday · ${format(value, "h:mm a")}`;
  return format(value, "MMM d · h:mm a");
}

export function formatLongDate(date: Date | string) {
  const value = typeof date === "string" ? parseISO(date) : date;
  return format(value, "MMMM d, yyyy");
}

export function formatRelative(date: Date | string) {
  const value = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(value, { addSuffix: true });
}

export function toDateParam(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function fromDateParam(value: string) {
  return parseISO(`${value}T00:00:00`);
}
