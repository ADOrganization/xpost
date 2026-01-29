import { getActiveWorkspace } from "@/lib/workspace";
import { XAccountsList } from "@/components/dashboard/x-accounts-list";
import { WorkspaceNameEditor } from "@/components/dashboard/workspace-name-editor";
import { OAuthFeedback } from "@/components/dashboard/oauth-feedback";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { workspace, role } = await getActiveWorkspace();
  const params = await searchParams;

  const xAccounts = workspace.xAccounts.map((account) => ({
    id: account.id,
    xUserId: account.xUserId,
    username: account.username,
    displayName: account.displayName,
    profileImageUrl: account.profileImageUrl,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace and connected accounts.
        </p>
      </div>

      <OAuthFeedback
        success={params.success}
        error={params.error}
      />

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Connected X Accounts</CardTitle>
          <CardDescription>
            Connect your X (Twitter) accounts to schedule and publish posts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <XAccountsList
            accounts={xAccounts}
            workspaceId={workspace.id}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            Your workspace details and configuration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Workspace Name
            </label>
            <WorkspaceNameEditor
              workspaceId={workspace.id}
              currentName={workspace.name}
              canEdit={role === "OWNER"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
