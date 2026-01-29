"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateWorkspaceName } from "@/actions/workspace";

interface WorkspaceNameEditorProps {
  workspaceId: string;
  currentName: string;
  canEdit: boolean;
}

export function WorkspaceNameEditor({ workspaceId, currentName, canEdit }: WorkspaceNameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateWorkspaceName(workspaceId, name);
    setSaving(false);
    if (result.success) {
      toast.success("Workspace name updated");
      setEditing(false);
    } else {
      toast.error(result.error || "Failed to update name");
    }
  }

  function handleCancel() {
    setName(currentName);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{currentName}</p>
        {canEdit && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
        className="h-8 max-w-xs"
        autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
      />
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSave} disabled={saving}>
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel} disabled={saving}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
