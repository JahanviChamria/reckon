"use client";

import { useEffect, useRef, useState } from "react";
import { setupCanvas, clamp } from "@/lib/canvas";
import type { WidgetProps } from "./types";

// Characteristic size (meters) of each landmark, ascending.
// Sources: NIST (particles), NASA (bodies), standard references.
type Landmark = { name: string; m: number };
const LANDMARKS: Landmark[] = [
  { name: "Proton", m: 1.7e-15 },
  { name: "Hydrogen atom", m: 1.1e-10 },
  { name: "DNA helix width", m: 2.4e-9 },
  { name: "Coronavirus", m: 1.2e-7 },
  { name: "Red blood cell", m: 8e-6 },
  { name: "Human hair width", m: 9e-5 },
  { name: "Grain of sand", m: 5e-4 },
  { name: "Ant", m: 4e-3 },
  { name: "Human", m: 1.7 },
  { name: "Blue whale", m: 30 },
  { name: "Eiffel Tower", m: 330 },
  { name: "Mount Everest", m: 8_849 },
  { name: "Earth", m: 1.274e7 },
  { name: "Jupiter", m: 1.399e8 },
  { name: "The Sun", m: 1.392e9 },
  { name: "Earth's orbit", m: 2.99e11 },
  { name: "Solar System", m: 2.9e13 },
  { name: "One light-year", m: 9.46e15 },
  { name: "Milky Way", m: 9.5e20 },
  { name: "Observable universe", m: 8.8e26 },
];

function formatMeters(m: number): string {
  if (m >= 9.46e15) return `${(m / 9.46e15).toPrecision(2)} light-years`;
  if (m >= 1e3) return `${(m / 1e3).toPrecision(3)} km`;
  if (m >= 1) return `${m.toPrecision(3)} m`;
  if (m >= 1e-3) return `${(m * 1e3).toPrecision(3)} mm`;
  if (m >= 1e-6) return `${(m * 1e6).toPrecision(3)} µm`;
  if (m >= 1e-9) return `${(m * 1e9).toPrecision(3)} nm`;
  return `${(m * 1e12).toPrecision(3)} pm`;
}

function nearest(exp: number): { cur: Landmark; smaller: Landmark | null } {
  let idx = 0;
  for (let i = 0; i < LANDMARKS.length; i++) {
    if (Math.log10(LANDMARKS[i].m) <= exp) idx = i;
  }
  return { cur: LANDMARKS[idx], smaller: idx > 0 ? LANDMARKS[idx - 1] : null };
}

export default function ScaleZoom({ params, accent = "#4ec9d9" }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<() => void>(() => {});

  const minExp = typeof params.minExp === "number" ? params.minExp : -15;
  const maxExp = typeof params.maxExp === "number" ? params.maxExp : 26.95;
  const startExp =
    typeof params.startExp === "number" ? params.startExp : (minExp + maxExp) / 2;

  const [t, setT] = useState(
    clamp((startExp - minExp) / (maxExp - minExp), 0, 1)
  );
  const exp = minExp + t * (maxExp - minExp);
  const { cur, smaller } = nearest(exp);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let width = 0;
    let height = 0;

    const layout = () => {
      const s = setupCanvas(canvas);
      if (!s) return null;
      width = s.width;
      height = s.height;
      return s.ctx;
    };
    let ctx = layout();

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const R = Math.min(width, height) * 0.36;

      // Faint concentric grid to give a sense of a viewport
      ctx.strokeStyle = "#20202e";
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, R * (0.6 + i * 0.26), 0, Math.PI * 2);
        ctx.stroke();
      }

      const near = nearest(minExp + tRef.current * (maxExp - minExp));

      // Current-scale object
      const grad = ctx.createRadialGradient(
        cx - R * 0.3,
        cy - R * 0.3,
        R * 0.1,
        cx,
        cy,
        R
      );
      grad.addColorStop(0, accent);
      grad.addColorStop(1, "#161622");
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.9;
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // Nested next-smaller landmark, to scale (clamped so it stays visible)
      if (near.smaller) {
        const ratio = near.smaller.m / near.cur.m;
        const r = Math.max(R * 0.015, R * ratio);
        ctx.beginPath();
        ctx.fillStyle = "#0a0a12";
        ctx.strokeStyle = "#5a5a72";
        ctx.lineWidth = 1;
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // ratio caption
        const times = near.cur.m / near.smaller.m;
        ctx.fillStyle = "#8a8a99";
        ctx.font = "10px var(--font-mono, monospace)";
        ctx.textAlign = "center";
        const label =
          times >= 1000
            ? `${times.toPrecision(2).replace(/\.?0+$/, "")}× wider`
            : `${Math.round(times)}× wider`;
        ctx.fillText(label, cx, cy + R + 22);
        ctx.fillStyle = "#55556a";
        ctx.fillText(`inner dot: ${near.smaller.name}`, cx, cy + R + 38);
      }
    };

    drawRef.current = draw;
    const ro = new ResizeObserver(() => {
      ctx = layout();
      draw();
    });
    ro.observe(canvas);
    draw();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accent, minExp, maxExp]);

  // Keep a ref of t for the draw closure, and redraw on change.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
    drawRef.current();
  }, [t]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-1 text-center">
        <div className="font-serif-display text-2xl">{cur.name}</div>
        <div className="label-mono mt-1 text-muted">{formatMeters(cur.m)}</div>
      </div>
      <div className="relative flex-1">
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
      <div className="mt-3 px-1">
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(t * 1000)}
          onChange={(e) => setT(Number(e.target.value) / 1000)}
          aria-label="Zoom scale"
          className="range-slider w-full"
          style={{ accentColor: accent }}
        />
        <div className="label-mono mt-1 flex justify-between text-faint">
          <span>{smaller ? "smaller" : "quark"}</span>
          <span>larger</span>
        </div>
      </div>
    </div>
  );
}
