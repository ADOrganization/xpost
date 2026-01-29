import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!membership) {
    const workspace = await prisma.workspace.create({
      data: {
        name: "My Workspace",
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });
    membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id, workspaceId: workspace.id },
      include: { workspace: true },
    });
  }

  const workspaceName = membership?.workspace.name ?? "Workspace";

  return (
    <DashboardShell workspaceName={workspaceName}>
      {children}
    </DashboardShell>
  );
}
