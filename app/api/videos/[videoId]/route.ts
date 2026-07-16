import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/authz";
import { requireCurrentUser } from "@/lib/current-user";

const patchSchema = z.object({ title: z.string().trim().min(1).max(120) });

async function findOwnedVideo(videoId: string) {
  const user = await requireCurrentUser();
  const video = await db.video.findFirst({ where: { id: videoId, deletedAt: null } });
  if (!video || (video.ownerId !== user.id && !isAdmin(user.email))) return null;
  return video;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const video = await findOwnedVideo((await params).videoId);
    if (!video) return NextResponse.json({ error: "Video not found." }, { status: 404 });
    const { title } = patchSchema.parse(await request.json());
    return NextResponse.json(await db.video.update({ where: { id: video.id }, data: { title } }));
  } catch (error) { return NextResponse.json({ error: error instanceof z.ZodError ? "Invalid title." : "Unable to update video." }, { status: 400 }); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const video = await findOwnedVideo((await params).videoId);
    if (!video) return NextResponse.json({ error: "Video not found." }, { status: 404 });
    await db.video.update({ where: { id: video.id }, data: { deletedAt: new Date(), publicId: null } });
    return new NextResponse(null, { status: 204 });
  } catch { return NextResponse.json({ error: "Unable to delete video." }, { status: 400 }); }
}
