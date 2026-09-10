"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/db";
import { createInviteCode, normalizeInviteCode } from "@/lib/invite";
import { MAX_SPACE_MEMBERS, isSpaceFull } from "@/lib/space-limits";
import { requireUser } from "@/lib/session";
import {
  createSpaceSchema,
  joinSpaceSchema,
  updateProfileSchema,
} from "@/lib/validations/space";
import { revalidatePath } from "next/cache";

export type SpaceState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createSpaceAction(
  _prev: SpaceState,
  formData: FormData,
): Promise<SpaceState> {
  try {
    const user = await requireUser();
    const parsed = createSpaceSchema.safeParse({
      name: formData.get("name"),
    });
    if (!parsed.success) {
      return {
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const existing = await prisma.sharedSpaceMember.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });
    if (existing) {
      redirect("/");
    }

    await prisma.sharedSpace.create({
      data: {
        name: parsed.data.name,
        inviteCode: createInviteCode(),
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    redirect("/");
  } catch (error) {
    unstable_rethrow(error);
    console.error(error);
    return { error: "Couldn't create the space. Please try again." };
  }
}

export async function joinSpaceAction(
  _prev: SpaceState,
  formData: FormData,
): Promise<SpaceState> {
  const user = await requireUser();
  const parsed = joinSpaceSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const existing = await prisma.sharedSpaceMember.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) {
    redirect("/");
  }

  const space = await prisma.sharedSpace.findUnique({
    where: { inviteCode: normalizeInviteCode(parsed.data.inviteCode) },
    select: { id: true },
  });
  if (!space) {
    return { error: "That invite code doesn't match a space." };
  }

  const joined = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "SharedSpace" WHERE id = ${space.id} FOR UPDATE`;
    const memberCount = await tx.sharedSpaceMember.count({
      where: { sharedSpaceId: space.id },
    });
    if (isSpaceFull(memberCount)) {
      return false;
    }
    await tx.sharedSpaceMember.create({
      data: {
        sharedSpaceId: space.id,
        userId: user.id,
        role: "MEMBER",
      },
    });
    return true;
  });

  if (!joined) {
    return {
      error: `This space already has ${MAX_SPACE_MEMBERS} people.`,
    };
  }

  redirect("/");
}

export async function updateProfileAction(
  _prev: SpaceState,
  formData: FormData,
): Promise<SpaceState> {
  const user = await requireUser();
  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      timezone: parsed.data.timezone,
    },
  });

  revalidatePath("/");
  revalidatePath("/settings");
  return {};
}

export async function rotateInviteCodeAction() {
  const user = await requireUser();
  const membership = await prisma.sharedSpaceMember.findFirst({
    where: { userId: user.id, role: "OWNER" },
    select: { sharedSpaceId: true },
  });
  if (!membership) {
    return;
  }

  await prisma.sharedSpace.update({
    where: { id: membership.sharedSpaceId },
    data: { inviteCode: createInviteCode() },
  });

  revalidatePath("/settings");
}

export async function updateProfileFormAction(formData: FormData) {
  await updateProfileAction({}, formData);
}

export async function createSpaceFormAction(formData: FormData) {
  const result = await createSpaceAction({}, formData);
  if (result.error || result.fieldErrors) {
    return result;
  }
}

export async function joinSpaceFormAction(formData: FormData) {
  const result = await joinSpaceAction({}, formData);
  if (result.error || result.fieldErrors) {
    return result;
  }
}
