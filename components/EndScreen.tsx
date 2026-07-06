"use client";

import type { FeedState } from "@/lib/types";

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

        <p className="label-mono mt-14 text-faint">Orbit</p>
      </div>
    </section>
  );
}
