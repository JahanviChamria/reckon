"use client";

export default function ProgressRing({
  current,
  total,
  accent,
  ended,
}: {
  current: number; // 0-based index of active card
  total: number;
  accent: string;
  ended: boolean;
}) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const progress = ended ? 1 : total > 0 ? (current + 1) / total : 0;
  const offset = c * (1 - progress);
  // Position of the travelling body along the ring (starts at top, clockwise).
  const angle = -Math.PI / 2 + progress * 2 * Math.PI;
  const bx = 20 + r * Math.cos(angle);
  const by = 20 + r * Math.sin(angle);

  return (
    <div className="pointer-events-none fixed right-5 top-[max(1.5rem,env(safe-area-inset-top))] z-20">
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="#23233199"
          strokeWidth="1.5"
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <circle cx={bx} cy={by} r="2.5" fill={accent} />
      </svg>
    </div>
  );
}
