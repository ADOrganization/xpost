"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/actions/workspace";

// ─── Types ───

interface AcceptInviteFormProps {
  code: string;
  workspaceName: string;
  role: string;
}

// ─── Component ───

export function AcceptInviteForm({
  code,
  workspaceName,
  role,
}: AcceptInviteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    try {
      const result = await acceptInvite(code);
      if (result.success) {
        toast.success(`You joined ${workspaceName}!`);
        router.push("/dashboard");
      } else {
        toast.error(result.error ?? "Failed to accept invite");
        setLoading(false);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleAccept} disabled={loading} size="lg">
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Joining...
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4" />
          Join as {role}
        </>
      )}
    </Button>
  );
}
