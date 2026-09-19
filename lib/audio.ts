/**
 * Pull raw audio out of whatever container the user dropped.
 * decodeAudioData handles mp4/aac, webm/opus, mov, wav... — whatever the
 * browser can already play. If it can't, we just skip speech indexing and
 * keep the visual scan.
 */
export async function decodeAudio(file: File): Promise<Float32Array | null> {
  try {
    const buf = await file.arrayBuffer();
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx({ sampleRate: 16_000 }); // whisper wants 16 kHz

    let audio: AudioBuffer;
    try {
      audio = await ctx.decodeAudioData(buf);
    } catch {
      // Some containers (mkv with weird codecs, m4a...) refuse to decode.
      await ctx.close();
      return null;
    }
    await ctx.close();

    if (audio.length === 0) return null;

    // mix down to mono
    const mono = new Float32Array(audio.length);
    for (let ch = 0; ch < audio.numberOfChannels; ch++) {
      const data = audio.getChannelData(ch);
      for (let i = 0; i < data.length; i++) mono[i] += data[i] / audio.numberOfChannels;
    }

    // whisper chokes on absurdly long inputs in one go — we still pass the
    // whole thing since the pipeline chunks internally (chunk_length_s).
    return mono;
  } catch (err) {
    console.warn("[vidseek] audio decode failed:", err);
    return null;
  }
}
