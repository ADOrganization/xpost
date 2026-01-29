import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { getUserXCredentials } from "@/actions/user-settings";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle user denial or errors from Twitter
    if (error) {
      console.error("X OAuth error:", error);
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=oauth_denied", request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=missing_params", request.url)
      );
    }

    // Read and parse the OAuth state cookie
    const cookieStore = await cookies();
    const oauthStateCookie = cookieStore.get("x_oauth_state");

    if (!oauthStateCookie?.value) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=missing_state", request.url)
      );
    }

    let oauthState: {
      codeVerifier: string;
      state: string;
      workspaceId: string;
      userId: string;
    };

    try {
      oauthState = JSON.parse(oauthStateCookie.value);
    } catch {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=invalid_state", request.url)
      );
    }

    // Verify state matches to prevent CSRF
    if (state !== oauthState.state) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=state_mismatch", request.url)
      );
    }

    // Get the user's X Developer App credentials
    const xCreds = await getUserXCredentials(oauthState.userId);
    if (!xCreds) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=missing_x_credentials", request.url)
      );
    }

    const { clientId, clientSecret } = xCreds;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/x/callback`;

    // Exchange authorization code for tokens using user's app credentials
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: oauthState.codeVerifier,
      client_id: clientId,
    });

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    const tokenResponse = await fetch(
      "https://api.twitter.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: tokenBody.toString(),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=token_exchange", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Fetch user info from Twitter
    const userResponse = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error("User info fetch failed:", errorData);
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=user_fetch", request.url)
      );
    }

    const userData = await userResponse.json();
    const { id: xUserId, username, name, profile_image_url } = userData.data;

    // Encrypt tokens and client credentials before storing
    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = encrypt(refresh_token);
    const encryptedClientId = encrypt(clientId);
    const encryptedClientSecret = encrypt(clientSecret);

    const tokenExpiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : null;

    // Upsert XAccount with user's app credentials stored alongside tokens
    await prisma.xAccount.upsert({
      where: { xUserId },
      update: {
        username,
        displayName: name,
        profileImageUrl: profile_image_url ?? null,
        encryptedAccessToken,
        encryptedRefreshToken,
        encryptedClientId,
        encryptedClientSecret,
        tokenExpiresAt,
        workspaceId: oauthState.workspaceId,
      },
      create: {
        xUserId,
        username,
        displayName: name,
        profileImageUrl: profile_image_url ?? null,
        encryptedAccessToken,
        encryptedRefreshToken,
        encryptedClientId,
        encryptedClientSecret,
        tokenExpiresAt,
        workspaceId: oauthState.workspaceId,
      },
    });

    // Clear the OAuth state cookie
    cookieStore.delete("x_oauth_state");

    return NextResponse.redirect(
      new URL("/dashboard/settings?success=connected", request.url)
    );
  } catch (error) {
    console.error("X OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=unknown", request.url)
    );
  }
}
