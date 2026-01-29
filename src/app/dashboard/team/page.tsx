import { getActiveWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { MemberList } from "@/components/dashboard/member-list";
import { InviteDialog } from "@/components/dashboard/invite-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function TeamPage() {
  const { workspace, role, userId } = await getActiveWorkspace();

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id },
    include: {
      user: {
        select: {
          email: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const serializedMembers = members.map((member) => ({
    id: member.id,
    userId: member.userId,
    role: member.role,
    user: {
      email: member.user.email,
      name: member.user.name,
      image: member.user.image,
    },
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your workspace members and invite new collaborators.
          </p>
        </div>
        {role === "OWNER" && <InviteDialog workspaceId={workspace.id} />}
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? "member" : "members"} in
            this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberList
            members={serializedMembers}
            currentUserRole={role}
            currentUserId={userId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
