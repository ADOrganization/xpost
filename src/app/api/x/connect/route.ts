import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace";
import { getUserXCredentials } from "@/actions/user-settings";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { success } = rateLimit(`x-connect:${session.user.id}`, 5, 60 * 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many connection attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Get user's own X Developer App credentials
    const xCreds = await getUserXCredentials(session.user.id);
    if (!xCreds) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=missing_x_credentials", process.env.NEXTAUTH_URL!)
      );
    }

    const { workspace } = await getActiveWorkspace();

    // Generate PKCE values
    const codeVerifier = crypto.randomBytes(32).toString("hex");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    // Generate random state for CSRF protection
    const state = crypto.randomBytes(16).toString("hex");

    // Build Twitter OAuth 2.0 authorization URL using user's own app
    const params = new URLSearchParams({
      response_type: "code",
      client_id: xCreds.clientId,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/x/callback`,
      scope: "tweet.read tweet.write users.read offline.access",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      force_login: "true",
    });

    const authorizationUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

    // Set OAuth state cookie on the redirect response directly
    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set("x_oauth_state", JSON.stringify({
      codeVerifier,
      state,
      workspaceId: workspace.id,
      userId: session.user.id,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error("X OAuth connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}
