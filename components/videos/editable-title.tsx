"use client";

import { Check, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function EditableTitle({ videoId, title }: { videoId: string; title: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const save = async () => { if (value.trim() && value.trim() !== title) await fetch(`/api/videos/${videoId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: value.trim() }) }); setEditing(false); router.refresh(); };
  return editing ? <span className="flex items-center gap-1"><input aria-label="Video title" autoFocus className="min-w-0 rounded-lg border border-[#625df5] px-2 py-1 font-sans text-sm font-bold outline-none" value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void save(); if (event.key === "Escape") setEditing(false); }} /><button className="rounded p-1 text-[#514bd9] hover:bg-[#f4f3ff]" onClick={() => void save()}><Check size={15} /></button><button className="rounded p-1 hover:bg-[#f4f3ff]" onClick={() => setEditing(false)}><X size={15} /></button></span> : <span className="group inline-flex items-center gap-1"><span className="font-sans text-sm font-bold">{title}</span><button aria-label="Rename video" className="rounded p-1 text-[#a3a0ab] opacity-0 transition hover:bg-[#f4f3ff] hover:text-[#514bd9] group-hover:opacity-100 focus:opacity-100" onClick={() => setEditing(true)}><Pencil size={14} /></button></span>;
}
