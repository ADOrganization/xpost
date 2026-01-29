import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getActiveWorkspace() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          xAccounts: true,
        },
      },
    },
  });

  if (!membership) redirect("/login");

  return {
    workspace: membership.workspace,
    role: membership.role,
    userId: session.user.id,
  };
}
