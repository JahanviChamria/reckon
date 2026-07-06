"use client";

import type { InteractiveCard as InteractiveCardType } from "@/lib/types";
import { TOPIC_ACCENT } from "@/lib/types";
import CardShell from "./CardShell";
import Widget from "../widgets/Widget";

export default function InteractiveCard({
  card,
  index,
  total,
  active,
}: {
  card: InteractiveCardType;
  index: number;
  total: number;
  active: boolean;
}) {
  return (
    <CardShell topic={card.topic} source={card.source} index={index} total={total}>
      <div className="flex h-full flex-col">
        <h2 className="mb-4 max-w-[30ch] font-serif-display text-[clamp(1.4rem,5.5vw,1.85rem)]">
          {card.question}
        </h2>
        <div className="min-h-0 flex-1">
          <Widget
            widget={card.widget}
            params={card.params}
            running={active}
            accent={TOPIC_ACCENT[card.topic]}
          />
        </div>
      </div>
    </CardShell>
  );
}
