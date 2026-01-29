import { getActiveWorkspace } from "@/lib/workspace";
import { PostList } from "@/components/dashboard/post-list";

export default async function DraftsPage() {
  const { workspace } = await getActiveWorkspace();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Drafts</h1>
        <p className="text-sm text-muted-foreground">
          Unpublished posts waiting to be scheduled or shared.
        </p>
      </div>

      <PostList
        workspaceId={workspace.id}
        status="DRAFT"
        emptyMessage="No drafts yet. Start composing to save your first draft."
      />
    </div>
  );
}
