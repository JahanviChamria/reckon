"use client";

import { useEffect, useRef, useState } from "react";
import { setupCanvas, clamp } from "@/lib/canvas";
import type { WidgetProps } from "./types";

const EARTH_AGE = 4.54e9; // years

// years ago. Sources: USGS, standard geologic timescale.
type Event = { name: string; ya: number };
const EVENTS: Event[] = [
  { name: "Earth forms", ya: 4.54e9 },
  { name: "First life", ya: 3.8e9 },
  { name: "Oxygen fills the air", ya: 2.4e9 },
  { name: "Complex cells", ya: 1.8e9 },
  { name: "Cambrian explosion", ya: 5.4e8 },
  { name: "Plants reach land", ya: 4.7e8 },
  { name: "First dinosaurs", ya: 2.3e8 },
  { name: "Dinosaurs wiped out", ya: 6.6e7 },
  { name: "First primates", ya: 5.5e7 },
  { name: "Genus Homo", ya: 2.8e6 },
  { name: "Homo sapiens", ya: 3e5 },
  { name: "Farming begins", ya: 1.2e4 },
  { name: "Now", ya: 0 },
];
const HUMAN_YA = 3e5;

function fmtYA(ya: number): string {
  if (ya <= 0) return "today";
  if (ya >= 1e9) return `${(ya / 1e9).toPrecision(2)} billion years ago`;
  if (ya >= 1e6) return `${(ya / 1e6).toPrecision(2)} million years ago`;
  if (ya >= 1e3) return `${Math.round(ya / 1e3)},000 years ago`;
  return `${Math.round(ya)} years ago`;
}

export default function DeepTime({ params, accent = "#e0a860" }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<() => void>(() => {});
  const tRef = useRef(
    typeof params.startT === "number" ? clamp(params.startT, 0, 1) : 0.5
  );
  const [tState, setTState] = useState(tRef.current);
  const draggingRef = useRef(false);

  // t: 0 = Earth forms (left), 1 = now (right)
  const ya = EARTH_AGE * (1 - tState);
  const nearestEv = EVENTS.reduce((best, e) =>
    Math.abs(e.ya - ya) < Math.abs(best.ya - ya) ? e : best
  );

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

    const padX = 20;
    const trackLen = () => width - padX * 2;
    const xForYA = (y: number) => padX + (1 - y / EARTH_AGE) * trackLen();

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const barY = height * 0.5;

      // Baseline
      ctx.strokeStyle = "#2a2a3a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padX, barY);
      ctx.lineTo(padX + trackLen(), barY);
      ctx.stroke();

      // Filled portion up to playhead
      const t = tRef.current;
      const headX = padX + t * trackLen();
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(padX, barY);
      ctx.lineTo(headX, barY);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Event ticks
      ctx.font = "9px var(--font-mono, monospace)";
      for (const e of EVENTS) {
        if (e.ya === 0) continue;
        const x = xForYA(e.ya);
        ctx.strokeStyle = "#3a3a4c";
        ctx.beginPath();
        ctx.moveTo(x, barY - 6);
        ctx.lineTo(x, barY + 6);
        ctx.stroke();
      }

      // Human span highlight (a hair's width at the right edge)
      const hx0 = xForYA(HUMAN_YA);
      const hx1 = xForYA(0);
      ctx.fillStyle = accent;
      ctx.fillRect(hx0 - 1, barY - 16, Math.max(2, hx1 - hx0), 32);
      ctx.fillStyle = "#8a8a99";
      ctx.textAlign = "right";
      ctx.fillText("all of humanity →", hx0 - 6, barY - 20);

      // Playhead
      ctx.strokeStyle = "#ececf0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(headX, barY - 26);
      ctx.lineTo(headX, barY + 26);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = accent;
      ctx.arc(headX, barY, 6, 0, Math.PI * 2);
      ctx.fill();

      // End labels
      ctx.fillStyle = "#55556a";
      ctx.font = "10px var(--font-mono, monospace)";
      ctx.textAlign = "left";
      ctx.fillText("4.5 Bya", padX, barY + 44);
      ctx.textAlign = "right";
      ctx.fillText("now", padX + trackLen(), barY + 44);
    };

    drawRef.current = draw;

    const setFromX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const t = clamp((clientX - rect.left - padX) / trackLen(), 0, 1);
      tRef.current = t;
      setTState(t);
    };
    const onDown = (e: PointerEvent) => {
      draggingRef.current = true;
      canvas.setPointerCapture(e.pointerId);
      setFromX(e.clientX);
    };
    const onMove = (e: PointerEvent) => {
      if (draggingRef.current) setFromX(e.clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    const ro = new ResizeObserver(() => {
      ctx = layout();
      draw();
    });
    ro.observe(canvas);
    draw();
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accent]);

  useEffect(() => {
    drawRef.current();
  }, [tState]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 text-center">
        <div className="font-serif-display text-2xl">{nearestEv.name}</div>
        <div className="label-mono mt-1 text-muted">{fmtYA(nearestEv.ya)}</div>
      </div>
      <div className="relative flex-1">
        <canvas ref={canvasRef} className="h-full w-full touch-none" />
      </div>
      <p className="label-mono mt-2 text-center text-faint">
        drag to scrub deep time
      </p>
    </div>
  );
}
