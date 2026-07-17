"use client";

import { AlertTriangle, Check, Copy, EyeOff, Globe2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VideoActions({ videoId, publicId, title, visibility }: { videoId: string; publicId: string | null; title: string; visibility: "PUBLIC" | "PRIVATE" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const request = async (url: string, options?: RequestInit) => { setPending(true); await fetch(url, options); setPending(false); router.refresh(); };
  const copyLink = async () => {
    if (!publicId) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/v/${publicId}`); setCopyMessage("Link copied successfully"); }
    catch { setCopyMessage("Unable to copy link"); }
    window.setTimeout(() => setCopyMessage(null), 2_800);
  };
  const buttonClass = "inline-flex items-center justify-center rounded-lg border border-[#ddd9e7] bg-white p-2 text-[0px] text-[#4f4a59] transition hover:-translate-y-px hover:border-[#625df5] hover:bg-[#f4f3ff] hover:text-[#514bd9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#625df5] disabled:cursor-not-allowed disabled:opacity-45";
  return <><div className="flex flex-wrap justify-end gap-2 font-sans text-xs font-semibold"><button aria-label="Copy link" className={buttonClass} disabled={!publicId || pending} onClick={() => void copyLink()} title="Copy link"><Copy size={15} /></button><button aria-label="Change visibility" title="Change visibility" className={buttonClass} disabled={pending} onClick={() => void request(`/api/videos/${videoId}/publish`, { method: "POST" })}>{visibility === "PUBLIC" ? <><EyeOff size={14} />Private</> : <><Globe2 size={14} />Publish</>}</button><button aria-label="Delete video" title="Delete video" className="inline-flex items-center gap-1.5 rounded-lg border border-[#f0cbd0] bg-white px-2.5 py-2 text-[#c2353a] transition hover:-translate-y-px hover:border-[#c2353a] hover:bg-[#fff1f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2353a] disabled:cursor-not-allowed disabled:opacity-45" disabled={pending} onClick={() => setConfirmingDelete(true)}><Trash2 size={14} />Delete</button></div>{copyMessage && <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-[#1d1a27] px-4 py-3 font-sans text-sm font-semibold text-white shadow-xl" role="status"><Check size={16} className="text-[#a9e4b9]" />{copyMessage}</div>}{confirmingDelete && <div className="fixed inset-0 z-50 grid place-items-center bg-[#171321]/45 p-5" role="dialog" aria-modal="true" aria-labelledby="delete-video-title"><div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"><span className="grid size-11 place-items-center rounded-2xl bg-[#fff0f1] text-[#c2353a]"><AlertTriangle size={21} /></span><h2 className="mt-5 text-xl font-bold" id="delete-video-title">Delete this video?</h2><p className="mt-2 font-sans text-sm leading-6 text-[#6f6c7b]">This will immediately disable its public link. This action cannot be undone.</p><div className="mt-6 flex justify-end gap-3"><button className={buttonClass} onClick={() => setConfirmingDelete(false)}>Cancel</button><button className="rounded-lg bg-[#c2353a] px-4 py-2 font-sans text-xs font-semibold text-white transition hover:bg-[#a92930]" onClick={() => { setConfirmingDelete(false); void request(`/api/videos/${videoId}`, { method: "DELETE" }); }}>Delete video</button></div></div></div>}</>;
}
