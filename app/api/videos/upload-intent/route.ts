import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { createUploadUrl, createVideoKey } from "@/lib/r2";

const bodySchema = z.object({
  title: z.string().trim().min(1).max(120),
  mimeType: z.enum(["video/webm", "video/mp4"]),
  byteSize: z.number().int().positive().max(500 * 1024 * 1024),
  durationSec: z.number().int().positive().max(600)
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = bodySchema.parse(await request.json());
    const objectKey = createVideoKey(user.id, body.mimeType);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const intent = await db.uploadIntent.create({ data: { ...body, objectKey, ownerId: user.id, expiresAt } });
    const uploadUrl = await createUploadUrl({ key: objectKey, mimeType: body.mimeType, byteSize: body.byteSize });
    return NextResponse.json({ intentId: intent.id, uploadUrl });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid recording metadata." }, { status: 400 });
    return NextResponse.json({ error: "Unable to prepare upload." }, { status: 500 });
  }
}
