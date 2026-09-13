import type { Metadata } from "next";
import Studio from "@/components/studio/Studio";

export const metadata: Metadata = {
  title: "Studio - VidSeek",
  description: "Scan a video locally and search it with natural language.",
};

export default function StudioPage() {
  return (
    <main className="min-h-dvh">
      <Studio />
    </main>
  );
}
