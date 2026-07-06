"use client";

import { useEffect, useRef, useState } from "react";
import { setupCanvas, clamp, easeInOut, lerp } from "@/lib/canvas";
import type { WidgetProps } from "./types";

// Real figures (km). Source: NASA planetary fact sheets.
const EARTH_MOON_KM = 384_400;
const EARTH_DIAM = 12_742;
// The seven other planets, in order, sized to scale. Their diameters sum to
// ~380,000 km — they line up almost exactly across the Earth-Moon gap.
const PLANETS: { name: string; diam: number; color: string }[] = [
  { name: "Mars", diam: 6_779, color: "#c1533b" },
  { name: "Mercury", diam: 4_879, color: "#8f8a86" },
  { name: "Venus", diam: 12_104, color: "#d8a24a" },
  { name: "Neptune", diam: 49_244, color: "#4b6ede" },
  { name: "Uranus", diam: 50_724, color: "#8fd6d6" },
  { name: "Saturn", diam: 116_460, color: "#d8c48a" },
  { name: "Jupiter", diam: 139_820, color: "#c9a06a" },
];

type Phase = "guess" | "revealing" | "done";

export default function MoonDistance({ running, onResolve, accent = "#8b7cff" }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const phaseRef = useRef<Phase>("guess");
  const guessRef = useRef(0.28); // fraction of track (0..1)
  const revealStartRef = useRef(0);
  const draggingRef = useRef(false);
  const resolvedRef = useRef(false);
  const drawRef = useRef<() => void>(() => {});
  const [phase, setPhase] = useState<Phase>("guess");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

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

    const marginX = 26;
    const earthX = () => marginX;
    const trackLen = () => width - marginX * 2;
    const midY = () => height * 0.46;
    const pxPerKm = () => (trackLen() * 0.9) / EARTH_MOON_KM;

    const draw = () => {
      if (!ctx) return;
      const w = width;
      const h = height;
      ctx.clearRect(0, 0, w, h);

      const ex = earthX();
      const my = midY();
      const scale = pxPerKm();
      const earthR = Math.max(4, (EARTH_DIAM / 2) * scale);
      const trueMoonX = ex + EARTH_MOON_KM * scale;

      // Track line
      ctx.strokeStyle = "#2a2a3a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ex, my);
      ctx.lineTo(ex + trackLen(), my);
      ctx.stroke();

      let phaseNow = phaseRef.current;
      let revealT = 1;
      if (phaseNow === "revealing") {
        const elapsed = performance.now() - revealStartRef.current;
        revealT = clamp(elapsed / 1400, 0, 1);
        if (revealT >= 1 && !resolvedRef.current) {
          resolvedRef.current = true;
          phaseRef.current = "done";
          setPhase("done");
          setTimeout(() => onResolve?.(), 300);
        }
      }

      // Moon position: interpolate guess -> true during reveal
      const guessX = ex + guessRef.current * trackLen();
      let moonX = guessX;
      if (phaseNow === "revealing") {
        moonX = lerp(guessX, trueMoonX, easeInOut(revealT));
      } else if (phaseNow === "done") {
        moonX = trueMoonX;
      }

      // Planets filling the gap (fade + slide in on reveal)
      if (phaseNow === "revealing" || phaseNow === "done") {
        const gapT = phaseNow === "done" ? 1 : clamp((revealT - 0.35) / 0.65, 0, 1);
        let cursor = ex + earthR + 3;
        ctx.save();
        ctx.globalAlpha = gapT;
        for (const p of PLANETS) {
          const r = (p.diam / 2) * scale;
          const cx = cursor + r;
          ctx.beginPath();
          ctx.fillStyle = p.color;
          ctx.arc(cx, my, r, 0, Math.PI * 2);
          ctx.fill();
          cursor += r * 2 + 1;
        }
        ctx.restore();
      }

      // Earth
      const eg = ctx.createRadialGradient(
        ex - earthR * 0.3,
        my - earthR * 0.3,
        earthR * 0.1,
        ex,
        my,
        earthR
      );
      eg.addColorStop(0, "#5aa9e6");
      eg.addColorStop(1, "#22608f");
      ctx.beginPath();
      ctx.fillStyle = eg;
      ctx.arc(ex, my, earthR, 0, Math.PI * 2);
      ctx.fill();

      // Moon
      const moonR = Math.max(3, earthR * 0.27);
      ctx.beginPath();
      ctx.fillStyle = "#c9c9d4";
      ctx.arc(moonX, my, moonR, 0, Math.PI * 2);
      ctx.fill();

      // Moon handle ring (guess phase only)
      if (phaseNow === "guess") {
        ctx.beginPath();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.9;
        ctx.arc(moonX, my, moonR + 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // "you" label under handle
        ctx.fillStyle = "#8a8a99";
        ctx.font = "10px var(--font-mono, monospace)";
        ctx.textAlign = "center";
        ctx.fillText("your guess", moonX, my + moonR + 26);
      }

      // Distance readout on done
      if (phaseNow === "done") {
        ctx.fillStyle = "#ececf0";
        ctx.font = "600 12px var(--font-mono, monospace)";
        ctx.textAlign = "center";
        ctx.fillText("384,400 km", (ex + trueMoonX) / 2, my - 66);
        ctx.fillStyle = "#8a8a99";
        ctx.font = "10px var(--font-mono, monospace)";
        ctx.fillText("30 Earths across", (ex + trueMoonX) / 2, my - 50);
      }

      if (running || phaseRef.current === "revealing") {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    // Pointer interaction (guess phase)
    const pointerToFraction = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left - earthX();
      return clamp(x / trackLen(), 0.04, 1);
    };

    const onDown = (e: PointerEvent) => {
      if (phaseRef.current !== "guess") return;
      draggingRef.current = true;
      canvas.setPointerCapture(e.pointerId);
      guessRef.current = pointerToFraction(e.clientX);
      draw();
    };
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      guessRef.current = pointerToFraction(e.clientX);
      draw();
    };
    const onUp = () => {
      draggingRef.current = false;
    };

    drawRef.current = draw;

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
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, accent]);

  const commit = () => {
    if (phaseRef.current !== "guess") return;
    revealStartRef.current = performance.now();
    phaseRef.current = "revealing";
    setPhase("revealing");
    // draw() self-schedules while phase is "revealing", kicking the loop.
    drawRef.current();
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative flex-1">
        <canvas ref={canvasRef} className="h-full w-full touch-none" />
      </div>
      <div className="mt-3 flex justify-center">
        {phase === "guess" ? (
          <button
            onClick={commit}
            className="label-mono rounded-full border px-6 py-2.5 transition-colors"
            style={{ borderColor: accent, color: accent }}
          >
            Reveal true distance
          </button>
        ) : (
          <p className="label-mono text-faint">
            {phase === "done" ? "every planet fits in the gap" : "revealing"}
          </p>
        )}
      </div>
    </div>
  );
}
