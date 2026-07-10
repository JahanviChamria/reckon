"use client";

import { useEffect, useRef, useState } from "react";
import { setupCanvas, clamp } from "@/lib/canvas";
import type { WidgetProps } from "./types";

// Two point sources emit identical waves. Where two crests meet the water
// heaves (constructive); where a crest meets a trough it stays flat, tracing
// the still nodal lines that fan out between the sources (destructive). Slide
// the sources apart to watch the fan tighten. Params: sep (initial px between
// sources), wavelength (px). A ripple-tank / double-slit demonstration.

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const v =
    m.length === 3
      ? m.split("").map((c) => c + c).join("")
      : m.padEnd(6, "0").slice(0, 6);
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export default function Interfere({ params, running, accent = "#4ec9d9" }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lambda = typeof params.wavelength === "number" ? params.wavelength : 26;
  const [sep, setSep] = useState(
    typeof params.sep === "number" ? params.sep : 70
  );
  const sepRef = useRef(sep);
  useEffect(() => {
    sepRef.current = sep;
  }, [sep]);

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

    const [r, g, b] = hexToRgb(accent);
    const k = (2 * Math.PI) / lambda;
    const cell = 7;
    const start = performance.now();

    const render = () => {
      if (!ctx) return;
      const t = (performance.now() - start) / 1000;
      const phase = 2 * Math.PI * 1.1 * t; // temporal oscillation
      const cx = width / 2;
      const sy = height * 0.24;
      const s1x = cx - sepRef.current / 2;
      const s2x = cx + sepRef.current / 2;

      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      for (let y = 0; y < height; y += cell) {
        for (let x = 0; x < width; x += cell) {
          const r1 = Math.hypot(x - s1x, y - sy);
          const r2 = Math.hypot(x - s2x, y - sy);
          const v = Math.sin(k * r1 - phase) + Math.sin(k * r2 - phase);
          // |v| near 0 along nodal lines -> stays dark; antinodes pulse bright
          ctx.globalAlpha = Math.min(1, Math.abs(v) / 2) * 0.9;
          ctx.fillRect(x, y, cell, cell);
        }
      }
      ctx.globalAlpha = 1;

      // Source markers
      for (const sx of [s1x, s2x]) {
        ctx.beginPath();
        ctx.fillStyle = "#ffffff";
        ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (running) rafRef.current = requestAnimationFrame(render);
    };

    const ro = new ResizeObserver(() => {
      ctx = layout();
      render();
    });
    ro.observe(canvas);

    if (running) rafRef.current = requestAnimationFrame(render);
    else render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accent, lambda, running]);

  const maxSep = 220;
  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative flex-1">
        <canvas ref={canvasRef} className="h-full w-full touch-none" />
      </div>
      <div className="mt-3 px-1">
        <input
          type="range"
          min={16}
          max={maxSep}
          value={sep}
          onChange={(e) => setSep(Number(e.target.value))}
          aria-label="Source spacing"
          className="range-slider w-full"
          style={{ accentColor: accent }}
        />
        <div className="label-mono mt-1 flex justify-between text-faint">
          <span>sources together</span>
          <span>apart</span>
        </div>
      </div>
      <p className="label-mono mt-1 text-center text-faint">
        dark lines are where the waves cancel
      </p>
    </div>
  );
}
