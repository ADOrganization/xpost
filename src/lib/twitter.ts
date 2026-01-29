import { TwitterApi } from "twitter-api-v2";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

/**
 * Creates an authenticated TwitterApi client for the given XAccount.
 * Automatically refreshes the access token if it has expired.
 */
export async function getTwitterClient(xAccountId: string): Promise<TwitterApi> {
  const xAccount = await prisma.xAccount.findUnique({
    where: { id: xAccountId },
  });

  if (!xAccount) {
    throw new Error(`XAccount not found: ${xAccountId}`);
  }

  let accessToken = decrypt(xAccount.encryptedAccessToken);

  // Check if the token has expired (with 60s buffer)
  const isExpired =
    xAccount.tokenExpiresAt &&
    xAccount.tokenExpiresAt.getTime() < Date.now() + 60_000;

  if (isExpired) {
    const refreshToken = decrypt(xAccount.encryptedRefreshToken);
    const refreshed = await refreshAccessToken(refreshToken);

    // Re-encrypt and persist new tokens
    await prisma.xAccount.update({
      where: { id: xAccountId },
      data: {
        encryptedAccessToken: encrypt(refreshed.accessToken),
        encryptedRefreshToken: encrypt(refreshed.refreshToken),
        tokenExpiresAt: refreshed.expiresAt,
      },
    });

    accessToken = refreshed.accessToken;
  }

  return new TwitterApi(accessToken);
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Refreshes an X/Twitter OAuth2 access token using the refresh token grant.
 */
async function refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "X_CLIENT_ID and X_CLIENT_SECRET must be set in environment variables"
    );
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to refresh X access token (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}
