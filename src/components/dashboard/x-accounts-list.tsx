"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { disconnectXAccount } from "@/actions/x-accounts";

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface XAccount {
  id: string;
  xUserId: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
}

interface XAccountsListProps {
  accounts: XAccount[];
  workspaceId: string;
}

export function XAccountsList({ accounts, workspaceId }: XAccountsListProps) {
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  async function handleDisconnect(accountId: string, username: string) {
    setDisconnectingId(accountId);
    try {
      const result = await disconnectXAccount(accountId);
      if (result.success) {
        toast.success(`Disconnected @${username}`);
      } else {
        toast.error(result.error ?? "Failed to disconnect account");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No X accounts connected yet. Connect one to start scheduling posts.
        </p>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  {account.profileImageUrl ? (
                    <AvatarImage
                      src={account.profileImageUrl}
                      alt={account.displayName}
                    />
                  ) : null}
                  <AvatarFallback>
                    {account.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {account.displayName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    @{account.username}
                  </span>
                </div>
                <Badge variant="secondary">Connected</Badge>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDisconnect(account.id, account.username)}
                disabled={disconnectingId === account.id}
                aria-label={`Disconnect @${account.username}`}
              >
                {disconnectingId === account.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button asChild>
        <Link href="/api/x/connect">
          <XLogo className="h-4 w-4" />
          Connect X Account
        </Link>
      </Button>
    </div>
  );
}
