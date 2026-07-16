"use client";

import { Copy, EyeOff, Globe2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VideoActions({ videoId, publicId, visibility }: { videoId: string; publicId: string | null; visibility: "PUBLIC" | "PRIVATE" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const request = async (url: string, options?: RequestInit) => { setPending(true); await fetch(url, options); setPending(false); router.refresh(); };
  return <div className="flex justify-end gap-2 font-sans text-xs font-semibold"><button aria-label="Copy link" className="rounded-lg border border-[#ddd9e7] p-2 disabled:opacity-50" disabled={!publicId || pending} onClick={() => publicId && navigator.clipboard.writeText(`${window.location.origin}/v/${publicId}`)}><Copy size={15} /></button><button className="rounded-lg border border-[#ddd9e7] p-2 disabled:opacity-50" disabled={pending} onClick={() => void request(`/api/videos/${videoId}/publish`, { method: "POST" })}>{visibility === "PUBLIC" ? <EyeOff size={15} /> : <Globe2 size={15} />}</button><button className="rounded-lg border border-[#f0cbd0] p-2 text-[#c2353a] disabled:opacity-50" disabled={pending} onClick={() => { if (confirm("Delete this video?")) void request(`/api/videos/${videoId}`, { method: "DELETE" }); }}><Trash2 size={15} /></button></div>;
}
