import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { MAX_IMAGE_SIZE_MB, MAX_VIDEO_SIZE_MB, ACCEPTED_MEDIA_TYPES } from "@/lib/constants";
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

  if (!ACCEPTED_MEDIA_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File must be an image (JPEG, PNG, GIF, WebP) or video (MP4, MOV)" },
      { status: 400 }
    );
  }

  const isVideo = file.type.startsWith("video/");
  const isGif = file.type === "image/gif";
  const maxSizeMB = isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return NextResponse.json(
      { error: `File must be under ${maxSizeMB}MB` },
      { status: 400 }
    );
  }

  const blob = await put(file.name, file, { access: "public" });

  const mediaType = isVideo ? "VIDEO" : isGif ? "GIF" : "IMAGE";

  return NextResponse.json({ url: blob.url, mediaType });
}
