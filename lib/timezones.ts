export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export function listTimeZones() {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }
  return [DEFAULT_TIMEZONE];
}

export function isValidTimeZone(value: string) {
  if (!value.trim()) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function timeZoneOptions(current?: string | null) {
  const zones = listTimeZones();
  if (current && !zones.includes(current) && isValidTimeZone(current)) {
    return [current, ...zones];
  }
  return zones;
}
