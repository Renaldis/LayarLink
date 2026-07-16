import Link from "next/link";
import { CalendarDays, ExternalLink, FolderOpen, LockKeyhole, Video } from "lucide-react";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/current-user";
import { VideoActions } from "@/components/videos/video-actions";

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function VideosPage() {
  const session = await getCurrentSession();
  if (!session?.user) redirect("/signin");
  const videos = await db.video.findMany({ where: { ownerId: session.user.id, deletedAt: null }, orderBy: { createdAt: "desc" } });

  return (
    <main className="min-h-screen bg-[#fbfbfd] px-5 py-6 text-[#1d1a27] sm:px-10">
      <SiteHeader userName={session.user.name} />
      <section className="mx-auto mt-14 max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="font-sans text-sm font-semibold text-[#625df5]">YOUR LIBRARY</p><h1 className="mt-2 text-4xl font-bold tracking-tight">My videos</h1><p className="mt-3 font-sans text-sm text-[#6f6c7b]">Manage recordings you have shared.</p></div><Link className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#625df5] px-4 py-3 font-sans text-sm font-semibold text-white" href="/#recorder"><Video size={16} />New recording</Link></div>
        {videos.length === 0 ? <div className="mt-10 grid min-h-64 place-items-center rounded-3xl border border-dashed border-[#d9d6e5] bg-white p-8 text-center"><div><FolderOpen className="mx-auto size-9 text-[#625df5]" /><h2 className="mt-4 text-xl font-bold">No videos yet</h2><p className="mt-2 font-sans text-sm text-[#6f6c7b]">Your shared recordings will appear here.</p></div></div> : <div className="mt-10 overflow-hidden rounded-3xl border border-[#e7e5f0] bg-white shadow-[0_14px_45px_rgba(31,27,58,0.06)]"><div className="hidden grid-cols-[1fr_150px_190px_1.8fr] gap-5 border-b border-[#eeedf3] px-6 py-4 font-sans text-xs font-bold tracking-wide text-[#777380] md:grid"><span>VIDEO</span><span>CREATED</span><span>EXPIRES</span><span className="text-right">ACTIONS</span></div>{videos.map((video) => <div className="grid gap-4 border-b border-[#f0eff4] px-6 py-5 last:border-0 md:grid-cols-[1fr_150px_190px_1.8fr] md:items-center" key={video.id}><div><div className="flex items-center gap-2"><h2 className="font-sans text-sm font-bold">{video.title}</h2>{video.visibility === "PRIVATE" && <span className="inline-flex items-center gap-1 rounded-md bg-[#f4f2f8] px-2 py-1 font-sans text-[10px] font-bold text-[#62507a]"><LockKeyhole size={11} />PRIVATE</span>}</div><p className="mt-1 font-sans text-xs text-[#787480]">{Math.floor(video.durationSec / 60)}:{String(video.durationSec % 60).padStart(2, "0")} · {formatBytes(video.byteSize)}</p></div><p className="font-sans text-sm text-[#68636f]">{video.createdAt.toLocaleDateString()}</p><p className="inline-flex items-center gap-2 font-sans text-sm text-[#68636f]"><CalendarDays size={15} />{video.expiresAt.toLocaleDateString()}</p><div className="flex items-center justify-end gap-3">{video.publicId ? <Link className="inline-flex items-center gap-1.5 rounded-lg bg-[#f4f3ff] px-2.5 py-2 font-sans text-xs font-semibold text-[#514bd9] transition hover:-translate-y-px hover:bg-[#e9e7ff]" href={`/v/${video.publicId}`}><ExternalLink size={14} />View</Link> : null}<VideoActions videoId={video.id} publicId={video.publicId} title={video.title} visibility={video.visibility} /></div></div>)}</div>}
      </section>
    </main>
  );
}
