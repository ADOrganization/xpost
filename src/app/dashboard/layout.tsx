import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Bootstrap: ensure user has at least one workspace
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
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header workspaceName={workspaceName} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
