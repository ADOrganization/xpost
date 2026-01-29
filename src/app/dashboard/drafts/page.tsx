import { getActiveWorkspace } from "@/lib/workspace";
import { PostList } from "@/components/dashboard/post-list";

export default async function DraftsPage() {
  const { workspace } = await getActiveWorkspace();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Drafts</h1>
        <p className="text-sm text-muted-foreground">
          Posts saved as drafts that haven&apos;t been scheduled yet.
        </p>
      </div>

      <PostList
        workspaceId={workspace.id}
        status="DRAFT"
        emptyMessage="No drafts. Save a post as draft from the compose panel."
      />
    </div>
  );
}
