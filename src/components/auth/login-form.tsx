"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const isVerify = searchParams.get("verify")?.startsWith("true") ?? false;
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("resend", {
      email,
      callbackUrl,
      redirect: false,
    });
    setLoading(false);
    if (result?.ok) {
      window.location.href = "/login?verify=true";
    }
  }

  if (isVerify) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-muted-foreground">
              We sent you a magic link. Click it to sign in.
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="ghost" asChild>
              <a href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold">Welcome to XPost</h1>
          <p className="text-muted-foreground">
            Sign in with your email to get started
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending link..." : "Continue with Email"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
