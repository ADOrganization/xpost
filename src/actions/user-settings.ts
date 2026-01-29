"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

// ---------------------------------------------------------------------------
// OpenAI API Key
// ---------------------------------------------------------------------------

export async function saveOpenAiKey(
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    if (!apiKey.startsWith("sk-")) {
      return { success: false, error: "Invalid API key format" };
    }

    const encrypted = encrypt(apiKey);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { encryptedOpenAiKey: encrypted },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to save API key" };
  }
}

export async function removeOpenAiKey(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { encryptedOpenAiKey: null },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to remove API key" };
  }
}

export async function hasOpenAiKey(): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.id) return false;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { encryptedOpenAiKey: true },
    });

    return !!user?.encryptedOpenAiKey;
  } catch {
    return false;
  }
}

export async function getUserOpenAiKey(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { encryptedOpenAiKey: true },
  });

  if (!user?.encryptedOpenAiKey) return null;

  return decrypt(user.encryptedOpenAiKey);
}

// ---------------------------------------------------------------------------
// X Developer App Credentials
// ---------------------------------------------------------------------------

export async function saveXCredentials(
  clientId: string,
  clientSecret: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    if (!clientId.trim() || !clientSecret.trim()) {
      return { success: false, error: "Both Client ID and Client Secret are required" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        encryptedXClientId: encrypt(clientId.trim()),
        encryptedXClientSecret: encrypt(clientSecret.trim()),
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to save X credentials" };
  }
}

export async function removeXCredentials(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        encryptedXClientId: null,
        encryptedXClientSecret: null,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to remove X credentials" };
  }
}

export async function hasXCredentials(): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.id) return false;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { encryptedXClientId: true, encryptedXClientSecret: true },
    });

    return !!user?.encryptedXClientId && !!user?.encryptedXClientSecret;
  } catch {
    return false;
  }
}

export async function getUserXCredentials(
  userId: string
): Promise<{ clientId: string; clientSecret: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { encryptedXClientId: true, encryptedXClientSecret: true },
  });

  if (!user?.encryptedXClientId || !user?.encryptedXClientSecret) return null;

  return {
    clientId: decrypt(user.encryptedXClientId),
    clientSecret: decrypt(user.encryptedXClientSecret),
  };
}
