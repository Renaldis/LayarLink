import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { rotatePublicId } from "@/lib/videos";

export async function POST(_: Request, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const user = await requireCurrentUser();
    const video = await db.video.findFirst({ where: { id: (await params).videoId, ownerId: user.id, deletedAt: null } });
    if (!video) return NextResponse.json({ error: "Video not found." }, { status: 404 });
    const isPublic = video.visibility === "PUBLIC";
    const updated = await db.video.update({ where: { id: video.id }, data: isPublic ? { visibility: "PRIVATE", publicId: null } : { visibility: "PUBLIC", publicId: rotatePublicId(video.publicId ?? "") } });
    return NextResponse.json({ visibility: updated.visibility, publicUrl: updated.publicId ? `/v/${updated.publicId}` : null });
  } catch { return NextResponse.json({ error: "Unable to change video visibility." }, { status: 400 }); }
}
