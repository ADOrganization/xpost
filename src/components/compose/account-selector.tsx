"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { XAccountOption } from "@/lib/types";

interface AccountSelectorProps {
  accounts: XAccountOption[];
  selectedId: string | null;
  onChange: (id: string) => void;
}

export function AccountSelector({
  accounts,
  selectedId,
  onChange,
}: AccountSelectorProps) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-3 text-center">
        <p className="text-sm text-muted-foreground">
          No accounts connected.{" "}
          <a
            href="/dashboard/settings"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Connect an account
          </a>
        </p>
      </div>
    );
  }

  const selectedAccount = accounts.find((a) => a.id === selectedId);

  return (
    <Select value={selectedId ?? undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an account">
          {selectedAccount && (
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                {selectedAccount.profileImageUrl && (
                  <AvatarImage
                    src={selectedAccount.profileImageUrl}
                    alt={selectedAccount.displayName}
                  />
                )}
                <AvatarFallback>
                  {selectedAccount.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {selectedAccount.displayName}
              </span>
              <span className="text-muted-foreground">
                @{selectedAccount.username}
              </span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                {account.profileImageUrl && (
                  <AvatarImage
                    src={account.profileImageUrl}
                    alt={account.displayName}
                  />
                )}
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
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
