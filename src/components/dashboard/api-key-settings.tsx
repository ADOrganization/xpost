"use client";

import { useState } from "react";
import { Key, Loader2, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { saveOpenAiKey, removeOpenAiKey } from "@/actions/user-settings";

interface ApiKeySettingsProps {
  hasKey: boolean;
}

export function ApiKeySettings({ hasKey: initialHasKey }: ApiKeySettingsProps) {
  const [hasKey, setHasKey] = useState(initialHasKey);
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleSave() {
    if (!apiKey.trim()) return;
    setIsSaving(true);
    try {
      const result = await saveOpenAiKey(apiKey.trim());
      if (result.success) {
        toast.success("API key saved");
        setHasKey(true);
        setApiKey("");
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
      const result = await removeOpenAiKey();
      if (result.success) {
        toast.success("API key removed");
        setHasKey(false);
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
      {hasKey ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            <span className="text-sm">API key configured</span>
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
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Key className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="pl-8"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || !apiKey.trim()}
            className="gap-1.5"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Your key is encrypted and only used for AI Assist features. Get one at{" "}
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          platform.openai.com
        </a>
      </p>
    </div>
  );
}
