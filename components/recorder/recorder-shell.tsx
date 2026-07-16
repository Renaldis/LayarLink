"use client";

import { Mic, MonitorUp, RotateCcw, Square, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MAX_RECORDING_SECONDS, formatDuration } from "@/lib/recorder-utils";
import { ScreenRecorder } from "./media-recorder";

type Status = "idle" | "recording" | "reviewing";

export function RecorderShell() {
  const recorder = useRef<ScreenRecorder | null>(null);
  const elapsedRef = useRef(0);
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [includeMic, setIncludeMic] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("Untitled recording");
  const [recording, setRecording] = useState<{ blob: Blob; mimeType: string } | null>(null);
  const [sharing, setSharing] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "recording") return;
    const startedAt = Date.now() - elapsedRef.current * 1_000;
    const interval = window.setInterval(() => {
      const nextElapsed = Math.min(MAX_RECORDING_SECONDS, Math.floor((Date.now() - startedAt) / 1_000));
      elapsedRef.current = nextElapsed;
      setElapsed(nextElapsed);
    }, 250);
    const limit = window.setTimeout(() => void stop(), Math.max(0, MAX_RECORDING_SECONDS - elapsedRef.current) * 1_000);
    return () => { window.clearInterval(interval); window.clearTimeout(limit); };
  }, [status]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); recorder.current?.cancel(); }, [previewUrl]);

  async function start() {
    if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
      setError("Browser ini belum mendukung perekaman layar. Gunakan Chrome atau Edge terbaru di desktop.");
      return;
    }
    try {
      setError(null);
      recorder.current = new ScreenRecorder();
      await recorder.current.start(includeMic);
      setElapsed(0);
      elapsedRef.current = 0;
      setStatus("recording");
    } catch (cause) {
      setError(cause instanceof DOMException && cause.name === "NotAllowedError" ? "Izin perekaman dibatalkan." : "Tidak dapat memulai perekaman.");
      recorder.current?.cancel();
    }
  }

  async function stop() {
    const result = await recorder.current?.stop();
    if (!result) return;
    const nextUrl = URL.createObjectURL(result.blob);
    setRecording(result);
    setPreviewUrl((current) => { if (current) URL.revokeObjectURL(current); return nextUrl; });
    setStatus("reviewing");
  }

  function recordAgain() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null); setRecording(null); setPublicUrl(null); setElapsed(0); elapsedRef.current = 0; setStatus("idle");
  }

  async function share() {
    if (!recording) return;
    setSharing(true); setError(null);
    try {
      const intentResponse = await fetch("/api/videos/upload-intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, mimeType: recording.mimeType, byteSize: recording.blob.size, durationSec: elapsed }) });
      if (!intentResponse.ok) throw new Error("Unable to prepare video upload.");
      const { intentId, uploadUrl } = await intentResponse.json() as { intentId: string; uploadUrl: string };
      const uploadResponse = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": recording.mimeType }, body: recording.blob });
      if (!uploadResponse.ok) throw new Error("Video upload failed.");
      const completeResponse = await fetch("/api/videos/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intentId }) });
      if (!completeResponse.ok) throw new Error("Unable to publish video.");
      const { publicUrl: url } = await completeResponse.json() as { publicUrl: string };
      setPublicUrl(url);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to share video."); }
    finally { setSharing(false); }
  }

  if (status === "reviewing" && previewUrl) return (
    <section id="recorder" className="mx-auto mt-12 max-w-3xl rounded-3xl border border-[#e7e5f0] bg-white p-5 shadow-[0_20px_60px_rgba(31,27,58,0.1)] sm:p-7">
      <video className="aspect-video w-full rounded-2xl bg-[#1d1a27]" controls src={previewUrl} />
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end"><label className="flex flex-1 flex-col gap-2 font-sans text-sm font-semibold">Title<input className="rounded-xl border border-[#dcd9e6] px-3 py-2 font-normal" value={title} onChange={(event) => setTitle(event.target.value)} /></label><button className="rounded-xl border border-[#dcd9e6] px-4 py-3 font-sans text-sm font-semibold" disabled={sharing} onClick={recordAgain}><RotateCcw className="mr-2 inline size-4" />Record again</button><button className="rounded-xl bg-[#625df5] px-4 py-3 font-sans text-sm font-semibold text-white disabled:opacity-60" disabled={sharing} onClick={() => void share()}>{sharing ? "Uploading..." : "Share video"}</button></div>
      {publicUrl && <p className="mt-4 font-sans text-sm text-[#27734c]">Video published: <a className="font-semibold underline" href={publicUrl}>{publicUrl}</a></p>}
    </section>
  );

  return <section id="recorder" className="mx-auto mt-12 max-w-xl rounded-3xl border border-[#e7e5f0] bg-white p-7 text-center shadow-[0_20px_60px_rgba(31,27,58,0.08)]">
    {status === "recording" ? <><p className="font-sans text-sm font-semibold text-[#625df5]">Recording in progress</p><p className="mt-3 font-mono text-5xl font-bold">{formatDuration(elapsed)} <span className="text-lg text-[#8c8995]">/ 10:00</span></p><div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[#eeedf3]"><div className="h-full bg-[#625df5]" style={{ width: `${(elapsed / MAX_RECORDING_SECONDS) * 100}%` }} /></div><button className="mt-7 rounded-xl bg-[#e5484d] px-5 py-3 font-sans font-semibold text-white" onClick={() => void stop()}><Square className="mr-2 inline size-4" />Stop recording</button></> : <><MonitorUp className="mx-auto size-8 text-[#625df5]" /><h2 className="mt-3 text-2xl font-bold">Ready when you are.</h2><p className="mt-2 font-sans text-sm text-[#6f6c7b]">Choose a screen, an app window, or a browser tab.</p><label className="mt-5 inline-flex items-center gap-2 font-sans text-sm"><input checked={includeMic} type="checkbox" onChange={(event) => setIncludeMic(event.target.checked)} /><Mic className="size-4" /> Include microphone</label><button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#625df5] px-5 py-3 font-sans font-semibold text-white" onClick={() => void start()}><Video className="size-4" /> Start recording</button></>}
    {error && <p role="alert" className="mt-4 font-sans text-sm text-[#c2353a]">{error}</p>}
  </section>;
}
