// A small generative "orbit sigil" unique to each card. Deterministic from the
// card id, so a card always draws the same figure, and every card differs.
// Simple line-art (a few ellipses + bodies) tinted to the topic accent, echoing
// the app's orbital-ring signature. Costs nothing per card — the content engine
// gets a distinctive visual identity without hand-drawn art.

function makeRng(seedStr: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let x = h >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

export default function CardMotif({
  seed,
  accent,
  size = 64,
}: {
  seed: string;
  accent: string;
  size?: number;
}) {
  const rand = makeRng(seed);
  const count = 2 + Math.floor(rand() * 2); // 2 or 3 orbits

  const orbits = Array.from({ length: count }, (_, i) => {
    const base = 15 + i * 12 + rand() * 5;
    const rx = base;
    const ry = base * (0.4 + rand() * 0.45); // eccentricity
    const rot = rand() * 180;
    const angle = rand() * Math.PI * 2;
    return {
      rx,
      ry,
      rot,
      bx: 50 + rx * Math.cos(angle),
      by: 50 + ry * Math.sin(angle),
      r: 1.6 + rand() * 1.5,
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
      style={{ overflow: "visible" }}
    >
      <circle cx="50" cy="50" r="2.6" fill={accent} />
      {orbits.map((o, i) => (
        <g key={i} transform={`rotate(${o.rot} 50 50)`}>
          <ellipse
            cx="50"
            cy="50"
            rx={o.rx}
            ry={o.ry}
            stroke={accent}
            strokeOpacity={0.32}
            strokeWidth={0.8}
          />
          <circle cx={o.bx} cy={o.by} r={o.r} fill={accent} />
        </g>
      ))}
    </svg>
  );
}
