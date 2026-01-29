"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeMemberRole, removeMember } from "@/actions/workspace";

// ─── Types ───

interface Member {
  id: string;
  userId: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  user: {
    email: string;
    name: string | null;
    image: string | null;
  };
}

interface MemberListProps {
  members: Member[];
  currentUserRole: "OWNER" | "EDITOR" | "VIEWER";
  currentUserId: string;
}

// ─── Helpers ───

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  EDITOR: "secondary",
  VIEWER: "outline",
};

// ─── Component ───

export function MemberList({
  members,
  currentUserRole,
  currentUserId,
}: MemberListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const isOwner = currentUserRole === "OWNER";

  async function handleRoleChange(
    memberId: string,
    newRole: "OWNER" | "EDITOR" | "VIEWER"
  ) {
    setLoadingId(memberId);
    try {
      const result = await changeMemberRole(memberId, newRole);
      if (result.success) {
        toast.success("Member role updated");
      } else {
        toast.error(result.error ?? "Failed to update role");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRemove(memberId: string, memberName: string) {
    setLoadingId(memberId);
    try {
      const result = await removeMember(memberId);
      if (result.success) {
        toast.success(`Removed ${memberName} from workspace`);
      } else {
        toast.error(result.error ?? "Failed to remove member");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No team members yet. Invite someone to get started.
        </p>
      ) : (
        members.map((member) => {
          const isSelf = member.userId === currentUserId;
          const displayName = member.user.name ?? member.user.email;
          const initials = displayName.charAt(0).toUpperCase();

          return (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  {member.user.image ? (
                    <AvatarImage src={member.user.image} alt={displayName} />
                  ) : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {member.user.name ?? "Unnamed"}
                    {isSelf && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {member.user.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner && !isSelf ? (
                  <>
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        handleRoleChange(
                          member.id,
                          value as "OWNER" | "EDITOR" | "VIEWER"
                        )
                      }
                      disabled={loadingId === member.id}
                    >
                      <SelectTrigger size="sm" className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OWNER">Owner</SelectItem>
                        <SelectItem value="EDITOR">Editor</SelectItem>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleRemove(
                          member.id,
                          member.user.name ?? member.user.email
                        )
                      }
                      disabled={loadingId === member.id}
                      aria-label={`Remove ${displayName}`}
                    >
                      {loadingId === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </>
                ) : (
                  <Badge variant={roleBadgeVariant[member.role]}>
                    {member.role}
                  </Badge>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
