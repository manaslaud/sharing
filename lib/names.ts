import { DEFAULT_TIMEZONE } from "./timezones";

export function firstName(name: string | null | undefined) {
  if (!name?.trim()) return "them";
  return name.trim().split(/\s+/)[0] ?? "them";
}

export function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function hourInTimeZone(date: Date, timeZone?: string | null) {
  try {
    return Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hourCycle: "h23",
        timeZone: timeZone || DEFAULT_TIMEZONE,
      }).format(date),
    );
  } catch {
    return date.getHours();
  }
}

