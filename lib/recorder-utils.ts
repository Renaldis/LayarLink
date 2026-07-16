export const MAX_RECORDING_SECONDS = 10 * 60;

export function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function normalizeVideoMimeType(mimeType: string) {
  if (mimeType.startsWith("video/webm")) return "video/webm";
  if (mimeType.startsWith("video/mp4")) return "video/mp4";
  throw new Error("Unsupported recording format.");
}
