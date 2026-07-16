"use client";

import { Video } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/"
    });

    if (error) {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-white p-6 text-[#1d1a27]">
      <section className="w-full max-w-sm rounded-3xl border border-[#ebeaf2] p-8 shadow-[0_20px_60px_rgba(31,27,58,0.08)]">
        <div className="grid size-11 place-items-center rounded-2xl bg-[#625df5] text-white"><Video aria-hidden="true" /></div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Welcome to LayarLink</h1>
        <p className="mt-3 font-sans text-sm leading-6 text-[#6f6c7b]">Sign in with Google to record and manage your screen captures.</p>
        <button className="mt-7 flex w-full items-center justify-center rounded-xl bg-[#1d1a27] px-4 py-3 font-sans text-sm font-semibold text-white disabled:opacity-60" disabled={loading} onClick={signIn} type="button">
          {loading ? "Opening Google..." : "Continue with Google"}
        </button>
      </section>
    </main>
  );
}
