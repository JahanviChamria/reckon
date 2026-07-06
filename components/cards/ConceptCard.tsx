"use client";

import type { ConceptCard as ConceptCardType } from "@/lib/types";
import CardShell from "./CardShell";

export default function ConceptCard({
  card,
  index,
  total,
  active,
}: {
  card: ConceptCardType;
  index: number;
  total: number;
  active: boolean;
}) {
  return (
    <CardShell topic={card.topic} source={card.source} index={index} total={total}>
      <div key={active ? "on" : "off"} className={active ? "animate-rise" : ""}>
        <span
          className="mb-6 block h-px w-10"
          style={{ background: "var(--accent)" }}
          aria-hidden
        />
        <h2 className="font-serif-display text-[clamp(1.9rem,7.5vw,2.6rem)]">
          {card.hook}
        </h2>
        <p className="mt-6 max-w-[34ch] text-[1.05rem] leading-relaxed text-muted">
          {card.body}
        </p>
      </div>
    </CardShell>
  );
}
