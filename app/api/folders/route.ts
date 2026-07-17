import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { folderNameSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const name = folderNameSchema.parse((await request.json()).name);
    const folder = await db.folder.create({ data: { name, ownerId: user.id } });
    return NextResponse.json(folder, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to create folder." }, { status: 400 }); }
}
