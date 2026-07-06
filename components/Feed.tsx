"use client";

import { useEffect, useRef, useState } from "react";
import type { Card } from "@/lib/types";
import { TOPIC_ACCENT } from "@/lib/types";
import { useFeedState } from "@/lib/useFeedState";
import ConceptCard from "./cards/ConceptCard";
import InteractiveCard from "./cards/InteractiveCard";
import PredictCard from "./cards/PredictCard";
import EndScreen from "./EndScreen";
import OrbitProgress from "./OrbitProgress";

export default function Feed({ cards }: { cards: Card[] }) {
  const { state, hydrated, setLastCardIndex, recordPrediction } = useFeedState();
  const scrollRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const restoredRef = useRef(false);

  const total = cards.length;
  const endIndex = total; // EndScreen is the last slide

  // Track the active slide via IntersectionObserver on the scroll container.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.index ?? "0"
            );
            setActive(idx);
          }
        }
      },
      { root, threshold: [0.55] }
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [total]);

  // Persist furthest-seen position.
  useEffect(() => {
    if (active < endIndex) setLastCardIndex(active);
  }, [active, endIndex, setLastCardIndex]);

  // Restore scroll position once after hydration.
  useEffect(() => {
    if (!hydrated || restoredRef.current) return;
    restoredRef.current = true;
    const idx = Math.min(state.lastCardIndex, total - 1);
    if (idx > 0) {
      const el = slideRefs.current[idx];
      if (el) el.scrollIntoView({ behavior: "auto" });
      setActive(idx);
    }
  }, [hydrated, state.lastCardIndex, total]);

  const activeAccent =
    active < total ? TOPIC_ACCENT[cards[active].topic] : TOPIC_ACCENT.space;

  return (
    <>
      <OrbitProgress
        current={active}
        total={total}
        accent={activeAccent}
        ended={active >= endIndex}
      />
      <div
        ref={scrollRef}
        className="feed-scroll h-[100dvh] w-full overflow-y-scroll"
      >
        {cards.map((card, i) => (
          <div
            key={card.id}
            data-index={i}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
          >
            {card.type === "concept" && (
              <ConceptCard
                card={card}
                index={i}
                total={total}
                active={i === active}
              />
            )}
            {card.type === "interactive" && (
              <InteractiveCard
                card={card}
                index={i}
                total={total}
                active={i === active}
              />
            )}
            {card.type === "predict" && (
              <PredictCard
                card={card}
                index={i}
                total={total}
                active={i === active}
                onCommit={recordPrediction}
              />
            )}
          </div>
        ))}
        <div
          data-index={endIndex}
          ref={(el) => {
            slideRefs.current[endIndex] = el;
          }}
        >
          <EndScreen
            state={state}
            cardsSeen={total}
            active={active === endIndex}
          />
        </div>
      </div>
    </>
  );
}
