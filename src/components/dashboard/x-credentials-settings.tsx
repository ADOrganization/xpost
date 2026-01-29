"use client";

import { useState } from "react";
import { Key, Loader2, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { saveXCredentials, removeXCredentials } from "@/actions/user-settings";

interface XCredentialsSettingsProps {
  hasCredentials: boolean;
}

export function XCredentialsSettings({
  hasCredentials: initialHasCredentials,
}: XCredentialsSettingsProps) {
  const [hasCredentials, setHasCredentials] = useState(initialHasCredentials);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleSave() {
    if (!clientId.trim() || !clientSecret.trim()) return;
    setIsSaving(true);
    try {
      const result = await saveXCredentials(clientId.trim(), clientSecret.trim());
      if (result.success) {
        toast.success("X API credentials saved");
        setHasCredentials(true);
        setClientId("");
        setClientSecret("");
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove() {
    setIsRemoving(true);
    try {
      const result = await removeXCredentials();
      if (result.success) {
        toast.success("X API credentials removed");
        setHasCredentials(false);
      } else {
        toast.error(result.error || "Failed to remove");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="space-y-3">
      {hasCredentials ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            <span className="text-sm">X API credentials configured</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isRemoving}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            {isRemoving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Remove
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Key className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Client ID"
              className="pl-8"
            />
          </div>
          <div className="relative">
            <Key className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Client Secret"
              className="pl-8"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || !clientId.trim() || !clientSecret.trim()}
            className="w-full gap-1.5"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              "Save Credentials"
            )}
          </Button>
        </div>
      )}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Your own X Developer App credentials. Posts use your API credits, not ours.
        </p>
        <p className="text-xs text-muted-foreground">
          Create an app at{" "}
          <a
            href="https://developer.x.com/en/portal/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            developer.x.com
          </a>
          {" "}and set the callback URL to:
        </p>
        <code className="block rounded bg-muted px-2 py-1 text-xs">
          {typeof window !== "undefined"
            ? `${window.location.origin}/api/x/callback`
            : "/api/x/callback"}
        </code>
      </div>
    </div>
  );
}
