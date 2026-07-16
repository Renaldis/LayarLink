import Link from "next/link";
import { Video } from "lucide-react";

export function SiteHeader({ userName }: { userName?: string }) {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between">
      <Link className="flex items-center gap-2.5 font-sans text-lg font-bold tracking-tight text-[#1d1a27]" href="/">
        <span className="grid size-9 place-items-center rounded-xl bg-[#625df5] text-white"><Video aria-hidden="true" size={17} /></span>
        LayarLink
      </Link>
      {userName ? (
        <div className="flex items-center gap-3"><Link className="font-sans text-sm font-semibold text-[#5a5565] transition hover:text-[#1d1a27]" href="/videos">My videos</Link><span className="rounded-xl bg-[#f3f2f8] px-4 py-2 font-sans text-sm font-semibold text-[#302d3a]">Hi, {userName}</span></div>
      ) : (
        <Link className="rounded-xl bg-[#1d1a27] px-4 py-2 font-sans text-sm font-semibold text-white transition hover:bg-[#343041]" href="/signin">Sign in</Link>
      )}
    </header>
  );
}
