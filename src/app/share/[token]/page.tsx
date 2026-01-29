import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SharedPostView } from "@/components/share/shared-post-view";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      post: {
        include: {
          threadItems: {
            orderBy: { position: "asc" },
            include: {
              media: { orderBy: { position: "asc" } },
              pollOptions: { orderBy: { position: "asc" } },
            },
          },
          xAccount: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImageUrl: true,
            },
          },
        },
      },
      comments: {
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      suggestions: {
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!shareLink || !shareLink.active) {
    notFound();
  }

  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    notFound();
  }

  const session = await auth();
  const isSignedIn = !!session?.user?.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Shared Draft</h1>
          <p className="text-sm text-muted-foreground">
            Preview and leave feedback on this post.
          </p>
        </div>

        <SharedPostView
          post={JSON.parse(JSON.stringify(shareLink.post))}
          comments={JSON.parse(JSON.stringify(shareLink.comments))}
          suggestions={JSON.parse(JSON.stringify(shareLink.suggestions))}
          shareLinkId={shareLink.id}
          token={token}
          isSignedIn={isSignedIn}
        />
      </div>
    </div>
  );
}
