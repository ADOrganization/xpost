"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: "You denied access to the app. Please try again.",
  missing_params: "OAuth callback was missing required parameters.",
  missing_state: "OAuth session expired. Please try connecting again.",
  invalid_state: "Invalid OAuth session. Please try connecting again.",
  state_mismatch: "OAuth state mismatch. Please try connecting again.",
  token_exchange: "Failed to exchange authorization code. Check your app credentials.",
  user_fetch: "Connected successfully but failed to fetch your X profile.",
  unknown: "Something went wrong. Please try again.",
};

interface OAuthFeedbackProps {
  success?: string;
  error?: string;
}

export function OAuthFeedback({ success, error }: OAuthFeedbackProps) {
  const router = useRouter();

  useEffect(() => {
    if (success === "connected") {
      toast.success("X account connected successfully!");
      router.replace("/dashboard/settings");
    } else if (error) {
      toast.error(ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unknown);
      router.replace("/dashboard/settings");
    }
  }, [success, error, router]);

  return null;
}
