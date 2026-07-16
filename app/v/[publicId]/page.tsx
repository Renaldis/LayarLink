import { CalendarDays, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { createPlaybackUrl } from "@/lib/r2";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentSession } from "@/lib/current-user";

export default async function PublicVideoPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const video = await db.video.findFirst({
    where: { publicId, visibility: "PUBLIC", deletedAt: null, expiresAt: { gt: new Date() } },
    include: { owner: { include: { profile: true } } }
  });

  if (!video) notFound();
  const [playbackUrl, session] = await Promise.all([createPlaybackUrl(video.objectKey), getCurrentSession()]);
  const ownerName = video.owner.profile?.displayName ?? video.owner.name;

  return (
    <main className="min-h-screen bg-[#fbfbfd] px-5 py-8 text-[#1d1a27] sm:px-10">
      <section className="mx-auto max-w-5xl">
        <SiteHeader userName={session?.user.name} />
        <div className="mt-10 overflow-hidden rounded-3xl border border-[#e7e5f0] bg-white shadow-[0_20px_60px_rgba(31,27,58,0.1)]">
          <video className="aspect-video w-full bg-[#15131e]" controls playsInline src={playbackUrl} />
          <div className="p-6 sm:p-8"><h1 className="text-3xl font-bold tracking-tight">{video.title}</h1><p className="mt-3 font-sans text-sm text-[#6f6c7b]">Shared by {ownerName}</p><div className="mt-6 flex flex-wrap gap-4 font-sans text-sm text-[#6f6c7b]"><span className="inline-flex items-center gap-2"><Clock size={16} />{Math.floor(video.durationSec / 60)}:{String(video.durationSec % 60).padStart(2, "0")}</span><span className="inline-flex items-center gap-2"><CalendarDays size={16} />Available until {video.expiresAt.toLocaleDateString()}</span></div></div>
        </div>
      </section>
    </main>
  );
}
