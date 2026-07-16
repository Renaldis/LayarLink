"use client";

import { Copy, EyeOff, Globe2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VideoActions({ videoId, publicId, title, visibility }: { videoId: string; publicId: string | null; title: string; visibility: "PUBLIC" | "PRIVATE" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const request = async (url: string, options?: RequestInit) => { setPending(true); await fetch(url, options); setPending(false); router.refresh(); };
  const rename = () => { const nextTitle = prompt("Video title", title)?.trim(); if (nextTitle && nextTitle !== title) void request(`/api/videos/${videoId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: nextTitle }) }); };
  const buttonClass = "inline-flex items-center gap-1.5 rounded-lg border border-[#ddd9e7] bg-white px-2.5 py-2 text-[#4f4a59] transition hover:-translate-y-px hover:border-[#625df5] hover:bg-[#f4f3ff] hover:text-[#514bd9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#625df5] disabled:cursor-not-allowed disabled:opacity-45";
  return <div className="flex flex-wrap justify-end gap-2 font-sans text-xs font-semibold"><button className={buttonClass} disabled={!publicId || pending} onClick={() => publicId && navigator.clipboard.writeText(`${window.location.origin}/v/${publicId}`)}><Copy size={14} />Copy</button><button className={buttonClass} disabled={pending} onClick={rename}><Pencil size={14} />Rename</button><button className={buttonClass} disabled={pending} onClick={() => void request(`/api/videos/${videoId}/publish`, { method: "POST" })}>{visibility === "PUBLIC" ? <><EyeOff size={14} />Private</> : <><Globe2 size={14} />Publish</>}</button><button className="inline-flex items-center gap-1.5 rounded-lg border border-[#f0cbd0] bg-white px-2.5 py-2 text-[#c2353a] transition hover:-translate-y-px hover:border-[#c2353a] hover:bg-[#fff1f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2353a] disabled:cursor-not-allowed disabled:opacity-45" disabled={pending} onClick={() => { if (confirm("Delete this video?")) void request(`/api/videos/${videoId}`, { method: "DELETE" }); }}><Trash2 size={14} />Delete</button></div>;
}
