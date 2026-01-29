import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AcceptInviteForm } from "@/components/invite/accept-invite-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Users } from "lucide-react";

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;

  // Look up the invite
  const invite = await prisma.workspaceInvite.findUnique({
    where: { code },
    include: {
      workspace: {
        select: { id: true, name: true },
      },
    },
  });

  // Invite not found
  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is invalid or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invite expired
  if (invite.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invite Expired</CardTitle>
            <CardDescription>
              This invite link has expired. Please ask the workspace owner for a
              new one.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is logged in
  const session = await auth();

  if (!session?.user?.id) {
    // Not logged in: show login button with redirect back to this invite
    const callbackUrl = `/invite/${code}`;
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Join {invite.workspace.name}</CardTitle>
            <CardDescription>
              You&apos;ve been invited to join as{" "}
              <Badge variant="secondary" className="ml-1">
                {invite.role}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              Sign in to accept this invitation.
            </p>
            <Button asChild size="lg">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              >
                Sign In to Continue
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is already a member
  const existingMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: invite.workspaceId,
        userId: session.user.id,
      },
    },
  });

  if (existingMembership) {
    redirect("/dashboard");
  }

  // Valid invite, logged in, not a member: show accept form
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Join {invite.workspace.name}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join this workspace as{" "}
            <Badge variant="secondary" className="ml-1">
              {invite.role}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <AcceptInviteForm
            code={code}
            workspaceName={invite.workspace.name}
            role={invite.role}
          />
        </CardContent>
      </Card>
    </div>
  );
}
