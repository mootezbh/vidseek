/**
 * Frame sampling. We use a hidden <video> element (separate from the player,
 * so scanning never disturbs playback), seek to evenly spaced timestamps and
 * paint each frame onto a small canvas.
 */

export function openVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const onError = () => reject(new Error("Couldn't read this video file."));
    video.addEventListener("error", onError, { once: true });
    video.addEventListener(
      "loadeddata",
      () => {
        video.removeEventListener("error", onError);
        resolve(video);
      },
      { once: true },
    );
  });
}

export function getDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.addEventListener(
      "loadedmetadata",
      () => resolve(video.duration || 0),
      { once: true },
    );
    video.addEventListener("error", () => reject(new Error("Couldn't read video metadata.")), {
      once: true,
    });
  });
}

/** Seek and wait for the frame to land (with a timeout for stubborn files). */
export function seekVideo(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener("seeked", finish);
      resolve();
    };
    video.addEventListener("seeked", finish);
    // some engines don't emit seeked when the time barely changes
    setTimeout(finish, 2500);
    video.currentTime = Math.max(0.001, t);
  });
}

/**
 * How many frames to aim for: denser on short videos, sparser on long ones,
 * always between 0.5s and 10s apart. Keeps a 2h movie from turning into
 * 10,000 embeddings.
 */
export function frameTimes(duration: number): number[] {
  const target = 120;
  const step = Math.min(10, Math.max(0.5, duration / target));
  const times: number[] = [];
  for (let t = 0; t < duration; t += step) times.push(t);
  if (times.length === 0) times.push(0);
  return times;
}

/** Draw the current video frame onto a fresh small canvas. */
export function drawFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const w = 320;
  const h = Math.round((video.videoHeight / Math.max(1, video.videoWidth)) * w) || 180;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0, w, h);
  return canvas;
}
