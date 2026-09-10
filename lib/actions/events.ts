"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSpaceContext } from "@/lib/session";
import { eventSchema, updateEventSchema } from "@/lib/validations/event";

export async function createEventAction(input: unknown) {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Check the event details." };
  }
  const ctx = await getSpaceContext();

  const event = await prisma.event.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt ?? null,
      creatorId: ctx.userId,
      sharedSpaceId: ctx.space.id,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true as const, id: event.id };
}

export async function updateEventAction(input: unknown) {
  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Check the event details." };
  }
  const ctx = await getSpaceContext();
  const event = await prisma.event.findFirst({
    where: { id: parsed.data.id, sharedSpaceId: { in: ctx.spaceIds } },
  });
  if (!event) {
    return { ok: false as const, error: "Event not found." };
  }

  await prisma.event.update({
    where: { id: event.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt ?? null,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteEventAction(id: string) {
  const ctx = await getSpaceContext();
  const event = await prisma.event.findFirst({
    where: { id, sharedSpaceId: { in: ctx.spaceIds } },
  });
  if (!event) return { ok: false };

  await prisma.event.delete({ where: { id: event.id } });
  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true };
}
