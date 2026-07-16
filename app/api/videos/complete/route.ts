import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { createPublicId, getExpiresAt } from "@/lib/videos";

const bodySchema = z.object({ intentId: z.string().cuid() });

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { intentId } = bodySchema.parse(await request.json());
    const intent = await db.uploadIntent.findFirst({ where: { id: intentId, ownerId: user.id, consumedAt: null, expiresAt: { gt: new Date() } } });
    if (!intent) return NextResponse.json({ error: "Upload intent is unavailable." }, { status: 404 });
    const settings = await db.appSetting.upsert({ where: { id: 1 }, update: {}, create: { id: 1, defaultRetentionDays: 30 } });
    const video = await db.$transaction(async (tx) => {
      const created = await tx.video.create({ data: { ownerId: user.id, title: intent.title, objectKey: intent.objectKey, mimeType: intent.mimeType, byteSize: intent.byteSize, durationSec: intent.durationSec, expiresAt: getExpiresAt(new Date(), settings.defaultRetentionDays), publicId: createPublicId() } });
      await tx.uploadIntent.update({ where: { id: intent.id }, data: { consumedAt: new Date() } });
      return created;
    });
    return NextResponse.json({ videoId: video.id, publicUrl: `/v/${video.publicId}` });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    return NextResponse.json({ error: "Unable to complete upload." }, { status: 500 });
  }
}
