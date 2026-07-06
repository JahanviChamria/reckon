"use client";

import { useEffect, useRef, useState } from "react";
import { setupCanvas } from "@/lib/canvas";
import type { WidgetProps } from "./types";

// Surface gravity (m/s^2). Source: NASA planetary fact sheets.
const GRAVITY: Record<string, number> = {
  Moon: 1.62,
  Earth: 9.81,
  Jupiter: 24.79,
};
const PRESETS = ["Moon", "Earth", "Jupiter"];

const DT = 1 / 120; // fixed physics step
const METERS_PER_SCREEN = 6; // vertical extent the canvas represents

type Ball = { x: number; y: number; vx: number; vy: number };
type Trace = { x: number; y: number }[];

export default function GravityToy({ running, accent = "#4ec9d9" }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const accRef = useRef(0);
  const lastRef = useRef(0);
  const ballRef = useRef<Ball | null>(null);
  const traceRef = useRef<Trace>([]);
  const gRef = useRef(GRAVITY.Moon);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const aimRef = useRef<{ x: number; y: number } | null>(null);
  const [preset, setPreset] = useState("Moon");

  useEffect(() => {
    gRef.current = GRAVITY[preset];
  }, [preset]);

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

    const pxPerM = () => height / METERS_PER_SCREEN;
    const floorY = () => height - 14;
    const startPos = () => ({ x: width * 0.5, y: height * 0.28 });

    const resetBall = () => {
      const p = startPos();
      ballRef.current = { x: p.x, y: p.y, vx: 0, vy: 0 };
      traceRef.current = [];
    };
    resetBall();

    const step = () => {
      const b = ballRef.current;
      if (!b) return;
      const scale = pxPerM();
      // semi-implicit Euler, fixed dt
      b.vy += gRef.current * DT * scale;
      b.x += b.vx * DT;
      b.y += b.vy * DT;

      const r = 9;
      const fy = floorY();
      if (b.y + r >= fy) {
        b.y = fy - r;
        b.vy *= -0.55; // damped bounce
        b.vx *= 0.82;
        if (Math.abs(b.vy) < 12 * scale * DT) b.vy = 0;
      }
      if (b.x - r < 0) {
        b.x = r;
        b.vx *= -0.7;
      }
      if (b.x + r > width) {
        b.x = width - r;
        b.vx *= -0.7;
      }
      const tr = traceRef.current;
      const last = tr[tr.length - 1];
      if (!last || Math.hypot(last.x - b.x, last.y - b.y) > 4) {
        tr.push({ x: b.x, y: b.y });
        if (tr.length > 120) tr.shift();
      }
    };

    const render = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const fy = floorY();

      // floor
      ctx.strokeStyle = "#2a2a3a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, fy);
      ctx.lineTo(width, fy);
      ctx.stroke();

      // trace
      const tr = traceRef.current;
      if (tr.length > 1) {
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tr[0].x, tr[0].y);
        for (let i = 1; i < tr.length; i++) ctx.lineTo(tr[i].x, tr[i].y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // aim line while dragging
      const b = ballRef.current;
      if (b && dragRef.current && aimRef.current) {
        ctx.strokeStyle = "#8a8a99";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(aimRef.current.x, aimRef.current.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ball
      if (b) {
        const grad = ctx.createRadialGradient(
          b.x - 3,
          b.y - 3,
          1,
          b.x,
          b.y,
          9
        );
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(1, accent);
        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(b.x, b.y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (now: number) => {
      if (!lastRef.current) lastRef.current = now;
      let frame = (now - lastRef.current) / 1000;
      lastRef.current = now;
      if (frame > 0.05) frame = 0.05; // clamp after tab switch
      accRef.current += frame;
      while (accRef.current >= DT) {
        if (!dragRef.current) step();
        accRef.current -= DT;
      }
      render();
      if (running) rafRef.current = requestAnimationFrame(loop);
    };

    // Flick interaction: press near ball, drag, release to throw
    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onDown = (e: PointerEvent) => {
      const p = toLocal(e);
      canvas.setPointerCapture(e.pointerId);
      resetBall();
      const b = ballRef.current!;
      b.x = p.x;
      b.y = p.y;
      dragRef.current = p;
      aimRef.current = p;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      aimRef.current = toLocal(e);
      const b = ballRef.current;
      if (b) {
        b.x = aimRef.current.x;
        b.y = aimRef.current.y;
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const end = toLocal(e);
      const b = ballRef.current;
      if (b) {
        // launch velocity from the drag gesture (px/s in screen space)
        b.vx = (end.x - dragRef.current.x) * 6;
        b.vy = (end.y - dragRef.current.y) * 6;
      }
      dragRef.current = null;
      aimRef.current = null;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    const ro = new ResizeObserver(() => {
      ctx = layout();
      resetBall();
    });
    ro.observe(canvas);

    lastRef.current = 0;
    accRef.current = 0;
    if (running) rafRef.current = requestAnimationFrame(loop);
    else render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, accent]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative flex-1">
        <canvas ref={canvasRef} className="h-full w-full touch-none" />
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {PRESETS.map((p) => {
          const active = p === preset;
          return (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className="label-mono rounded-full border px-4 py-2 transition-colors"
              style={{
                borderColor: active ? accent : "#2a2a3a",
                color: active ? accent : "#8a8a99",
                background: active ? `${accent}14` : "transparent",
              }}
            >
              {p}
            </button>
          );
        })}
      </div>
      <p className="label-mono mt-2 text-center text-faint">
        drag the ball and release to throw
      </p>
    </div>
  );
}
