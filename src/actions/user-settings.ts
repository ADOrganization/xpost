"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

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
