export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function pickSuccessor<T extends { userId: string; role: string }>(
  members: T[],
  departingUserId: string,
) {
  const others = members.filter((member) => member.userId !== departingUserId);
  if (others.length === 0) return null;
  return others.find((member) => member.role === "OWNER") ?? others[0];
}

export function partitionJournalTransfers(
  departing: { id: string; date: string }[],
  successorDates: Iterable<string>,
) {
  const taken = new Set(successorDates);
  const transferIds: string[] = [];
  const conflictIds: string[] = [];

  for (const entry of departing) {
    if (taken.has(entry.date)) {
      conflictIds.push(entry.id);
    } else {
      transferIds.push(entry.id);
      taken.add(entry.date);
    }
  }

  return { transferIds, conflictIds };
}
