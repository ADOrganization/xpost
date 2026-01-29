"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInvite } from "@/actions/workspace";

// ─── Types ───

interface InviteDialogProps {
  workspaceId: string;
}

// ─── Component ───

export function InviteDialog({ workspaceId }: InviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerateLink() {
    setLoading(true);
    setInviteLink(null);

    try {
      const result = await createInvite(workspaceId, role);
      if (result.success && result.code) {
        const link = `${window.location.origin}/invite/${result.code}`;
        setInviteLink(link);
      } else {
        toast.error(result.error ?? "Failed to generate invite link");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when dialog closes
      setInviteLink(null);
      setRole("EDITOR");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a Team Member</DialogTitle>
          <DialogDescription>
            Generate an invite link to share with your team. The link expires in
            7 days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as "EDITOR" | "VIEWER")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EDITOR">Editor</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === "EDITOR"
                ? "Editors can create and manage posts."
                : "Viewers can only view posts and schedules."}
            </p>
          </div>

          <Button
            onClick={handleGenerateLink}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Invite Link"
            )}
          </Button>

          {inviteLink && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Invite Link</label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
