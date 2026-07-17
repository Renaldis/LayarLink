"use client";

import Link from "next/link";
import { FolderPlus, Folder } from "lucide-react";
import { useRouter } from "next/navigation";

export function FolderSidebar({ folders, selectedFolderId }: { folders: { id: string; name: string; _count: { videos: number } }[]; selectedFolderId?: string }) {
  const router = useRouter();
  const createFolder = async () => { const name = prompt("Folder name")?.trim(); if (!name) return; await fetch("/api/folders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }); router.refresh(); };
  return <aside className="mb-6 w-full font-sans sm:mb-0 sm:w-48"><Link className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold ${!selectedFolderId ? "bg-[#eeedff] text-[#514bd9]" : "text-[#595461] hover:bg-[#f4f3f8]"}`} href="/videos">All videos</Link>{folders.map((folder) => <Link className={`mt-1 flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${selectedFolderId === folder.id ? "bg-[#eeedff] text-[#514bd9]" : "text-[#595461] hover:bg-[#f4f3f8]"}`} href={`/videos?folder=${folder.id}`} key={folder.id}><span className="flex items-center gap-2"><Folder size={15} />{folder.name}</span><span className="text-xs opacity-70">{folder._count.videos}</span></Link>)}<button className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#514bd9] transition hover:bg-[#f4f3ff]" onClick={() => void createFolder()}><FolderPlus size={16} />New folder</button></aside>;
}
