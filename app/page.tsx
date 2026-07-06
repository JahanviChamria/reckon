"use client";

import { useEffect, useMemo, useState } from "react";
import type { Card } from "@/lib/types";
import { buildFeed, todayKey } from "@/lib/feed";
import Feed from "@/components/Feed";
import rawCards from "@/content/cards.json";

export default function Home() {
  // The daily feed depends on the viewer's local date, so build it after mount
  // to keep server and client output identical (no hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const feed = useMemo<Card[]>(() => {
    if (!mounted) return [];
    if (typeof window !== "undefined" && window.location.search.includes("card=")) {
      const id = new URLSearchParams(window.location.search).get("card");
      const one = (rawCards as Card[]).find((c) => c.id === id);
      if (one) return [one];
    }
    return buildFeed(todayKey(), rawCards as Card[]);
  }, [mounted]);

  if (!mounted) {
    return (
      <main className="flex h-[100dvh] w-full items-center justify-center">
        <span className="label-mono animate-fade text-faint">Orbit</span>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[520px]">
      <Feed cards={feed} />
    </main>
  );
}
