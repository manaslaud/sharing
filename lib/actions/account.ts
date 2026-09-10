"use server";

import { AuthError } from "next-auth";
import type { Prisma } from "@prisma/client";
import { redirect, unstable_rethrow } from "next/navigation";
import { signOut } from "@/auth";
import {
  dateKey,
  partitionJournalTransfers,
  pickSuccessor,
} from "@/lib/account-deletion";
import { prisma } from "@/lib/db";
import { createInviteCode } from "@/lib/invite";
import { firstName } from "@/lib/names";
import { verifyPassword } from "@/lib/password";
import { requireUser } from "@/lib/session";
import { z } from "zod";

export type DeleteAccountState = {
  error?: string;
};

const deleteAccountSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

async function reassignTags(
  tx: Prisma.TransactionClient,
  fromUserId: string,
  toUserId: string,
) {
  const tags = await tx.tag.findMany({
    where: { createdById: fromUserId },
  });

  for (const tag of tags) {
    const existing = await tx.tag.findUnique({
      where: {
        name_createdById: { name: tag.name, createdById: toUserId },
      },
    });

    if (!existing) {
      await tx.tag.update({
        where: { id: tag.id },
        data: { createdById: toUserId },
      });
      continue;
    }

    const noteLinks = await tx.noteTag.findMany({
      where: { tagId: tag.id },
    });
    for (const link of noteLinks) {
      await tx.noteTag.upsert({
        where: {
          noteId_tagId: { noteId: link.noteId, tagId: existing.id },
        },
        create: { noteId: link.noteId, tagId: existing.id },
        update: {},
      });
    }

    const journalLinks = await tx.journalEntryTag.findMany({
      where: { tagId: tag.id },
    });
    for (const link of journalLinks) {
      await tx.journalEntryTag.upsert({
        where: {
          journalEntryId_tagId: {
            journalEntryId: link.journalEntryId,
            tagId: existing.id,
          },
        },
        create: {
          journalEntryId: link.journalEntryId,
          tagId: existing.id,
        },
        update: {},
      });
    }

    await tx.noteTag.deleteMany({ where: { tagId: tag.id } });
    await tx.journalEntryTag.deleteMany({ where: { tagId: tag.id } });
    await tx.tag.delete({ where: { id: tag.id } });
  }
}

export async function deleteAccountAction(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  try {
    const sessionUser = await requireUser();
    const parsed = deleteAccountSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      return { error: "Enter your email and password to confirm." };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });

    if (!user) {
      redirect("/login");
    }

    if (parsed.data.email !== user.email.toLowerCase()) {
      return { error: "Type your current email to confirm deletion." };
    }

    if (!user.passwordHash) {
      return { error: "This account cannot be deleted from the app." };
    }

    const valid = await verifyPassword(
      parsed.data.password,
      user.passwordHash,
    );
    if (!valid) {
      return { error: "Password is incorrect." };
    }

    const whoLeft = firstName(user.name);

    await prisma.$transaction(
      async (tx) => {
        const memberships = await tx.sharedSpaceMember.findMany({
          where: { userId: user.id },
          include: {
            sharedSpace: {
              include: { members: true },
            },
          },
        });

        for (const membership of memberships) {
          const space = membership.sharedSpace;
          const successor = pickSuccessor(space.members, user.id);

          if (!successor) {
            await tx.sharedSpace.delete({ where: { id: space.id } });
            continue;
          }

          const successorId = successor.userId;

          if (membership.role === "OWNER") {
            await tx.sharedSpaceMember.updateMany({
              where: { sharedSpaceId: space.id, userId: successorId },
              data: { role: "OWNER" },
            });
          }

          await tx.note.updateMany({
            where: {
              ownerId: user.id,
              sharedSpaceId: space.id,
              visibility: "SHARED",
            },
            data: { ownerId: successorId },
          });

          const sharedJournal = await tx.journalEntry.findMany({
            where: {
              authorId: user.id,
              sharedSpaceId: space.id,
              visibility: "SHARED",
            },
            select: { id: true, date: true },
          });
          const successorJournal = await tx.journalEntry.findMany({
            where: {
              authorId: successorId,
              date: { in: sharedJournal.map((entry) => entry.date) },
            },
            select: { date: true },
          });
          const { transferIds } = partitionJournalTransfers(
            sharedJournal.map((entry) => ({
              id: entry.id,
              date: dateKey(entry.date),
            })),
            successorJournal.map((entry) => dateKey(entry.date)),
          );

          if (transferIds.length > 0) {
            await tx.journalEntry.updateMany({
              where: { id: { in: transferIds } },
              data: { authorId: successorId },
            });
          }

          await tx.event.updateMany({
            where: { creatorId: user.id, sharedSpaceId: space.id },
            data: { creatorId: successorId },
          });

          await tx.reminder.updateMany({
            where: { creatorId: user.id, sharedSpaceId: space.id },
            data: { creatorId: successorId },
          });

          await tx.activity.updateMany({
            where: { actorId: user.id, sharedSpaceId: space.id },
            data: { actorId: successorId },
          });

          await tx.noteRevision.updateMany({
            where: { editorId: user.id },
            data: { editorId: successorId },
          });

          await reassignTags(tx, user.id, successorId);

          await tx.sharedSpaceMember.delete({ where: { id: membership.id } });

          await tx.sharedSpace.update({
            where: { id: space.id },
            data: { inviteCode: createInviteCode() },
          });

          await tx.notification.create({
            data: {
              userId: successorId,
              type: "MEMBER_LEFT",
              title: `${whoLeft} left your shared space`,
              body: "Shared notes and journal entries are still here. The invite code was refreshed.",
            },
          });
        }

        await tx.reminder.updateMany({
          where: { assignedToId: user.id },
          data: { assignedToId: null },
        });

        await tx.verificationToken.deleteMany({
          where: { identifier: user.email },
        });

        await tx.user.delete({ where: { id: user.id } });
      },
      { timeout: 20_000 },
    );

    await signOut({ redirectTo: "/login?deleted=1" });
    return {};
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthError) {
      redirect("/login?deleted=1");
    }
    console.error(error);
    return { error: "Couldn't delete your account. Please try again." };
  }
}
