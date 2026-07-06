"use client";

import { useEffect, useRef, useState } from "react";
import type { PredictCard as PredictCardType, Prediction } from "@/lib/types";
import { TOPIC_ACCENT } from "@/lib/types";
import { easeOut } from "@/lib/canvas";
import CardShell from "./CardShell";
import CardMotif from "../CardMotif";
import Widget from "../widgets/Widget";

function useCountUp(target: number, run: boolean, ms = 1100) {
  const [val, setVal] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / ms, 1);
      setVal(target * easeOut(t));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, run, ms]);
  return val;
}

/** Format a running value to the same number of decimals as its target,
 *  with thousands separators. 99.86 → "99.86", 30000 → "30,000". */
function makeFormatter(target: number): (n: number) => string {
  const decimals = (String(target).split(".")[1] ?? "").length;
  return (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
}

function Reveal({
  card,
  accent,
}: {
  card: PredictCardType;
  accent: string;
}) {
  const { animation, value = 0, unit, widget, params } = card.reveal;
  const counted = useCountUp(value, animation === "countUp");
  const fmt = makeFormatter(value);
  const [barT, setBarT] = useState(0);

  useEffect(() => {
    if (animation !== "barGrow") return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / 1000, 1);
      setBarT(easeOut(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animation]);

  if (widget) {
    return (
      <div className="min-h-0 w-full flex-1">
        <Widget widget={widget} params={params ?? {}} running accent={accent} />
      </div>
    );
  }

  if (animation === "barGrow") {
    return (
      <div className="w-full">
        <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full"
            style={{
              width: `${barT * 100}%`,
              background: accent,
              transition: "none",
            }}
          />
        </div>
        <div className="label-mono mt-2 text-muted">
          {fmt(value)} {unit}
        </div>
      </div>
    );
  }

  if (animation === "countUp") {
    return (
      <div className="text-center">
        <span
          className="font-mono text-[clamp(2.5rem,12vw,3.75rem)] font-semibold tabular-nums"
          style={{ color: accent }}
        >
          {fmt(counted)}
        </span>
        {unit ? <span className="ml-2 text-lg text-muted">{unit}</span> : null}
      </div>
    );
  }

  // Text-only reveal: the kicker carries it.
  return null;
}

export default function PredictCard({
  card,
  index,
  total,
  active,
  onCommit,
}: {
  card: PredictCardType;
  index: number;
  total: number;
  active: boolean;
  onCommit?: (p: Prediction) => void;
}) {
  const accent = TOPIC_ACCENT[card.topic];
  const [chosen, setChosen] = useState<number | null>(null);
  const [showKicker, setShowKicker] = useState(false);

  const pick = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    onCommit?.({
      cardId: card.id,
      chosenIndex: i,
      correct: i === card.correctIndex,
    });
    // Land the kicker after the reveal settles: count/bar animations get their
    // full run plus a ~300ms beat; interactive and text-only reveals land sooner.
    const anim = card.reveal.animation;
    const settle = anim === "countUp" ? 1400 : anim === "barGrow" ? 1300 : 650;
    setTimeout(() => setShowKicker(true), settle);
  };

  const committed = chosen !== null;

  return (
    <CardShell
      topic={card.topic}
      source={committed ? card.source : undefined}
      index={index}
      total={total}
    >
      <div className="flex h-full flex-col">
        <CardMotif seed={card.id} accent={accent} size={56} />
        <span className="label-mono mb-4 mt-4 text-faint">Predict</span>
        <h2 className="font-serif-display text-[clamp(1.5rem,6vw,2.1rem)]">
          {card.prompt}
        </h2>

        {!committed ? (
          <div className="mt-8 flex flex-col gap-3">
            {card.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => pick(i)}
                className="rounded-xl border border-hairline bg-surface px-5 py-4 text-left text-[1.02rem] text-fg transition-colors active:bg-surface-2"
                style={{ borderColor: "var(--color-hairline)" }}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-6 flex min-h-0 flex-1 flex-col">
            <div className="flex flex-col gap-1.5">
              {card.options.map((opt, i) => {
                const isCorrect = i === card.correctIndex;
                const isChosen = i === chosen;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-[0.9rem] transition-colors"
                    style={{
                      borderColor: isCorrect
                        ? accent
                        : "var(--color-hairline)",
                      background: isCorrect
                        ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                        : "transparent",
                      opacity: isCorrect || isChosen ? 1 : 0.4,
                    }}
                  >
                    <span style={{ color: isCorrect ? accent : undefined }}>
                      {opt}
                    </span>
                    <span className="label-mono text-faint">
                      {isCorrect
                        ? "correct"
                        : isChosen
                          ? "your pick"
                          : ""}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
              <Reveal card={card} accent={accent} />
              {showKicker ? (
                <p className="animate-rise max-w-[36ch] text-center font-serif text-[1.05rem] italic leading-snug text-fg">
                  {card.kicker}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </CardShell>
  );
}
