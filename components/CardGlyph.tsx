import type { ReactNode } from "react";
import CardMotif from "./CardMotif";

// A small library of simple line glyphs, each reflecting a card's subject.
// Consistent stroke style, tinted to the topic accent. Cards reference one by
// name via their `visual` field; anything unset falls back to a generative
// orbit sigil, so the library can grow lazily as new cards are written.

const GLYPHS: Record<string, (a: string) => ReactNode> = {
  sun: () => (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8" />
    </>
  ),
  clock: () => (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.5 2" />
    </>
  ),
  thermometer: (a) => (
    <>
      <path d="M12 4.2a1.7 1.7 0 0 1 1.7 1.7v7.5a3.2 3.2 0 1 1-3.4 0V5.9A1.7 1.7 0 0 1 12 4.2Z" />
      <circle cx="12" cy="16.4" r="1.7" fill={a} stroke="none" />
    </>
  ),
  star: (a) => (
    <path
      d="M12 3l1.7 6.6L20.5 11l-6.8 1.4L12 19l-1.7-6.6L3.5 11l6.8-1.4z"
      fill={a}
      stroke="none"
    />
  ),
  "planet-rings": () => (
    <>
      <circle cx="12" cy="11" r="5" />
      <ellipse cx="12" cy="11" rx="10" ry="3.2" transform="rotate(-20 12 11)" />
    </>
  ),
  mountain: () => <path d="M3 19L8.5 9l4 6 2.5-4L21 19z" />,
  droplet: () => <path d="M12 4c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9z" />,
  waves: () => (
    <>
      <path d="M8 8c2 2.4 2 5.6 0 8" />
      <path d="M11.5 5.5c3.4 4 3.4 9 0 13" />
      <path d="M15 3.5c4.8 5.4 4.8 11.6 0 17" />
    </>
  ),
  atom: (a) => (
    <>
      <circle cx="12" cy="12" r="1.7" fill={a} stroke="none" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" />
    </>
  ),
  cell: (a) => (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="13.5" cy="11" r="3" />
      <circle cx="13.5" cy="11" r="0.9" fill={a} stroke="none" />
    </>
  ),
  heart: () => (
    <path d="M12 20S4 14.6 4 9.3A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.3C20 14.6 12 20 12 20z" />
  ),
  leaf: () => (
    <>
      <path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14z" />
      <path d="M5 19 15 9" />
    </>
  ),
  bolt: () => <path d="M13 3 7 13h4l-1 8 8-11h-4z" />,
  globe: () => (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <ellipse cx="12" cy="12" rx="3.4" ry="8.5" />
      <path d="M3.6 12h16.8" />
    </>
  ),
  core: (a) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.8" fill={a} stroke="none" />
    </>
  ),
  layers: () => (
    <>
      <path d="M4 8c4-2 12-2 16 0" />
      <path d="M4 12c4-2 12-2 16 0" />
      <path d="M4 16c4-2 12-2 16 0" />
    </>
  ),
  snowflake: () => (
    <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M12 6l-2 1.5M12 6l2 1.5M12 18l-2-1.5M12 18l2 1.5" />
  ),
  balloon: (a) => (
    <>
      <circle cx="12" cy="8.5" r="5" />
      <path d="M12 13.5l1 1.7h-2z" fill={a} stroke="none" />
      <path d="M12 15.3c0 2.5 1.2 3.2 0 5.7" />
    </>
  ),
  cycle: () => (
    <>
      <path d="M5.5 9a7 7 0 0 1 11.7-2" />
      <path d="M18.5 15a7 7 0 0 1-11.7 2" />
      <path d="M17.5 3.5V7h-3.5M6.5 20.5V17h3.5" />
    </>
  ),
  spiral: () => (
    <path d="M12 12a1.8 1.8 0 1 1 1.8-1.8 4 4 0 1 1-4 4 6.2 6.2 0 1 1 6.2-6.2" />
  ),
  feather: () => (
    <>
      <path d="M19 5C11 5 5 11 5 19" />
      <path d="M19 5c-2 6.2-6 10.2-12 12" />
      <path d="M8.5 15.5 12 12" />
    </>
  ),
};

export default function CardGlyph({
  name,
  seed,
  accent,
  size = 64,
}: {
  name?: string;
  seed: string;
  accent: string;
  size?: number;
}) {
  const glyph = name ? GLYPHS[name] : undefined;
  if (!glyph) return <CardMotif seed={seed} accent={accent} size={size} />;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={accent}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {glyph(accent)}
    </svg>
  );
}
