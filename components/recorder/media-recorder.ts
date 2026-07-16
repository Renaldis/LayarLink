export type RecordingResult = { blob: Blob; mimeType: string };

export class ScreenRecorder {
  private recorder: MediaRecorder | null = null;
  private streams: MediaStream[] = [];
  private chunks: BlobPart[] = [];

  async start(includeMicrophone: boolean) {
    const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    this.streams = [display];
    const tracks = [...display.getVideoTracks(), ...display.getAudioTracks()];

    if (includeMicrophone) {
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.streams.push(microphone);
      tracks.push(...microphone.getAudioTracks());
    }

    const stream = new MediaStream(tracks);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
    this.chunks = [];
    this.recorder = new MediaRecorder(stream, { mimeType });
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.recorder.start(1_000);
    display.getVideoTracks()[0]?.addEventListener("ended", () => this.stop());
  }

  stop(): Promise<RecordingResult | null> {
    const activeRecorder = this.recorder;
    if (!activeRecorder || activeRecorder.state === "inactive") return Promise.resolve(null);
    return new Promise((resolve) => {
      activeRecorder.onstop = () => {
        const mimeType = activeRecorder.mimeType || "video/webm";
        const blob = new Blob(this.chunks, { type: mimeType });
        this.stopTracks();
        this.recorder = null;
        resolve({ blob, mimeType });
      };
      activeRecorder.stop();
    });
  }

  cancel() {
    if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
    this.stopTracks();
    this.recorder = null;
    this.chunks = [];
  }

  private stopTracks() {
    this.streams.flatMap((stream) => stream.getTracks()).forEach((track) => track.stop());
    this.streams = [];
  }
}
