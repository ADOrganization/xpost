import { Suspense } from "react";
import { getActiveWorkspace } from "@/lib/workspace";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import type { XAccountOption } from "@/lib/types";

export default async function DashboardPage() {
  const { workspace } = await getActiveWorkspace();

  const accounts: XAccountOption[] = workspace.xAccounts.map((a) => ({
    id: a.id,
    username: a.username,
    displayName: a.displayName,
    profileImageUrl: a.profileImageUrl,
  }));

  return (
    <Suspense>
      <DashboardContent
        workspaceId={workspace.id}
        accounts={accounts}
      />
    </Suspense>
  );
}
