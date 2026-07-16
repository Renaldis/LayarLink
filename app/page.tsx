import { ArrowRight, Video } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isSignedIn = Boolean(session?.user);
  const actionHref = isSignedIn ? "#recorder" : "/signin";

  return (
    <main className="min-h-screen overflow-hidden bg-white px-6 py-6 text-[#1d1a27] sm:px-10">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <Link className="flex items-center gap-2 font-sans text-lg font-bold tracking-tight" href="/">
          <span className="grid size-8 place-items-center rounded-[10px] bg-[#625df5] text-white"><Video aria-hidden="true" size={16} /></span>
          capture
        </Link>
        {isSignedIn ? (
          <span className="rounded-xl bg-[#f3f2f8] px-4 py-2 font-sans text-sm font-semibold text-[#302d3a]">Hi, {session?.user.name}</span>
        ) : (
          <Link className="rounded-xl bg-[#1d1a27] px-4 py-2 font-sans text-sm font-semibold text-white transition hover:bg-[#343041]" href="/signin">Sign in</Link>
        )}
      </nav>
      <section className="mx-auto flex min-h-[calc(100vh-96px)] max-w-4xl flex-col items-center justify-center text-center">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-20 -z-0 rounded-full bg-[#e4e2ff] blur-3xl" />
          <p className="relative font-sans text-sm font-semibold text-[#625df5]">Screen recording that gets out of your way.</p>
          <h1 className="relative mt-5 max-w-3xl text-5xl font-bold leading-[0.98] tracking-[-0.065em] sm:text-7xl">Record. Share. Done.</h1>
          <p className="relative mx-auto mt-6 max-w-xl font-sans text-base leading-7 text-[#6f6c7b] sm:text-lg">Capture a screen, an application, or a tab. Review it before anyone else sees it.</p>
          <Link className="relative mt-9 inline-flex items-center gap-2 rounded-2xl bg-[#625df5] px-5 py-3.5 font-sans text-base font-bold text-white shadow-[0_16px_35px_rgba(98,93,245,0.28)] transition hover:-translate-y-0.5 hover:bg-[#4e48db]" href={actionHref}>
            <Video aria-hidden="true" size={18} /> Start recording <ArrowRight aria-hidden="true" size={18} />
          </Link>
          <div className="relative mx-auto mt-11 flex max-w-md flex-wrap justify-center gap-2 font-sans text-xs font-medium text-[#6f6c7b]">
            <span className="rounded-full bg-[#f3f2f8] px-3 py-1.5">Screen, app, or tab</span>
            <span className="rounded-full bg-[#f3f2f8] px-3 py-1.5">Audio when available</span>
            <span className="rounded-full bg-[#f3f2f8] px-3 py-1.5">10 minute maximum</span>
          </div>
        </div>
      </section>
    </main>
  );
}
