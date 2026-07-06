import type { Card, Topic } from "./types";
import { TOPICS } from "./types";

const FEED_SIZE = 25;

/** Deterministic 32-bit hash of the date string → PRNG seed. */
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** xorshift32 PRNG. Returns a function producing floats in [0, 1). */
function makePrng(seed: number): () => number {
  let x = seed || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Today's date as YYYY-MM-DD in the viewer's local time zone. */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isPredict(c: Card): boolean {
  return c.type === "predict";
}

function isBigWidget(c: Card): boolean {
  return (
    c.type === "interactive" &&
    (c.widget === "scaleZoom" || c.widget === "deepTime")
  );
}

/**
 * Build today's feed: a deterministic per-day selection and ordering.
 *
 * Rhythm constraints (best-effort, order matters most):
 *  - round-robin topics so no two consecutive cards share a topic
 *  - never two predict cards back to back
 *  - one "big" widget (scaleZoom / deepTime) surfaces inside the first 5
 *  - cap at 25
 */
export function buildFeed(dateKey: string, cards: Card[]): Card[] {
  const rand = makePrng(hashSeed(dateKey));

  // Group and shuffle within each topic for daily variety.
  const byTopic = new Map<Topic, Card[]>();
  for (const t of TOPICS) byTopic.set(t, []);
  for (const c of cards) byTopic.get(c.topic)?.push(c);
  for (const t of TOPICS) byTopic.set(t, shuffle(byTopic.get(t)!, rand));

  // Round-robin across a shuffled topic order to interleave.
  const topicOrder = shuffle(TOPICS, rand);
  const interleaved: Card[] = [];
  let added = true;
  while (added && interleaved.length < cards.length) {
    added = false;
    for (const t of topicOrder) {
      const bucket = byTopic.get(t)!;
      if (bucket.length) {
        interleaved.push(bucket.shift()!);
        added = true;
      }
    }
  }

  // Enforce "no two predicts adjacent" with local swaps.
  for (let i = 1; i < interleaved.length; i++) {
    if (isPredict(interleaved[i]) && isPredict(interleaved[i - 1])) {
      const swap = interleaved.findIndex(
        (c, j) =>
          j > i &&
          !isPredict(c) &&
          !isPredict(interleaved[j - 1]) &&
          (j + 1 >= interleaved.length || !isPredict(interleaved[j + 1]))
      );
      if (swap !== -1) {
        [interleaved[i], interleaved[swap]] = [
          interleaved[swap],
          interleaved[i],
        ];
      }
    }
  }

  // Ensure a big widget lands in the first five.
  const firstBig = interleaved.findIndex(isBigWidget);
  if (firstBig >= 5) {
    const target = 2 + Math.floor(rand() * 2); // slot 2 or 3
    const [big] = interleaved.splice(firstBig, 1);
    interleaved.splice(target, 0, big);
  }

  return interleaved.slice(0, FEED_SIZE);
}

export { FEED_SIZE };
