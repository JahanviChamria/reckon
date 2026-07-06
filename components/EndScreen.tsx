"use client";

import { useState } from "react";
import type { FeedState } from "@/lib/types";
import { shareResult } from "@/lib/share";

function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${d} ${months[m - 1]} ${y}`;
}

export default function EndScreen({
  state,
  cardsSeen,
  active,
}: {
  state: FeedState;
  cardsSeen: number;
  active: boolean;
}) {
  const total = state.predictions.length;
  const correct = state.predictions.filter((p) => p.correct).length;
  const [sharing, setSharing] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const stats: { label: string; value: string }[] = [
    { label: "Cards", value: String(cardsSeen) },
    {
      label: "Predictions",
      value: total ? `${correct} / ${total}` : "—",
    },
    {
      label: "Day",
      value: String(state.daysVisited),
    },
  ];

  const onShare = async () => {
    if (sharing) return;
    setSharing(true);
    setNote(null);
    const result = await shareResult({
      cardsSeen,
      correct,
      total,
      day: state.daysVisited,
      dateLabel: formatDate(state.dateKey),
    });
    setSharing(false);
    if (result === "downloaded") setNote("Image saved");
    else if (result === "error") setNote("Could not create image");
  };

  return (
    <section className="feed-card relative flex h-[100dvh] w-full flex-col items-center justify-center px-8 text-center">
      <div className={active ? "animate-rise" : ""}>
        <span
          className="mx-auto mb-8 block h-px w-12"
          style={{ background: "var(--color-space)" }}
          aria-hidden
        />
        <h2 className="font-serif-display text-[clamp(2rem,9vw,3rem)]">
          That&apos;s today.
        </h2>
        <p className="mx-auto mt-4 max-w-[28ch] text-[1.05rem] leading-relaxed text-muted">
          The feed ends on purpose. A new one arrives tomorrow.
        </p>

        <div className="mx-auto mt-12 grid max-w-xs grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-mono text-2xl tabular-nums text-fg">
                {s.value}
              </div>
              <div className="label-mono mt-1 text-faint">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3">
          <button
            onClick={onShare}
            disabled={sharing}
            className="label-mono rounded-full border px-7 py-3 transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--color-space)", color: "var(--color-space)" }}
          >
            {sharing ? "Preparing" : "Share today"}
          </button>
          <span className="label-mono h-4 text-faint">{note ?? ""}</span>
        </div>

        <p className="label-mono mt-10 text-faint">Reckon</p>
      </div>
    </section>
  );
}
