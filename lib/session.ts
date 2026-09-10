import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  timezone: true,
} as const;

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user;
}

export async function getSpaceContext() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const membership = await prisma.sharedSpaceMember.findFirst({
    where: { userId },
    include: {
      sharedSpace: {
        include: {
          members: {
            include: {
              user: { select: userSelect },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    redirect("/onboarding");
  }

  const space = membership.sharedSpace;
  const partner =
    space.members.find((member) => member.userId !== userId)?.user ?? null;
  const memberIds = space.members.map((member) => member.userId);

  return {
    userId,
    user: session.user,
    membership,
    space,
    partner,
    memberIds,
    spaceIds: [space.id],
  };
}

export async function getMembershipOrNull() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.sharedSpaceMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
}
