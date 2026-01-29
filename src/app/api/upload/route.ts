import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { MAX_IMAGE_SIZE_MB } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = rateLimit(`upload:${session.user.id}`, 20, 60 * 1000);
  if (!success) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "File must be an image" },
      { status: 400 }
    );
  }

  const maxSizeBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return NextResponse.json(
      { error: `File must be under ${MAX_IMAGE_SIZE_MB}MB` },
      { status: 400 }
    );
  }

  const blob = await put(file.name, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
