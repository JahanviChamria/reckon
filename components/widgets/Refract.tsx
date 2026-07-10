"use client";

import { useEffect, useRef } from "react";
import { setupCanvas, clamp } from "@/lib/canvas";
import type { WidgetProps } from "./types";

// Drag a light beam onto the boundary between two media and watch it bend by
// Snell's law: n1 sinθ1 = n2 sinθ2. Aiming from the denser medium, the beam
// cannot escape past the critical angle and reflects entirely (total internal
// reflection). Params: n1 (top), n2 (bottom), top/bottom labels, startAngle°.
// Refractive indices: air 1.0, water 1.33, glass 1.5. Standard references.

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

export default function Refract({ params, accent = "#4ec9d9" }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(
    typeof params.startAngle === "number" ? params.startAngle : 40
  );

  const n1 = typeof params.n1 === "number" ? params.n1 : 1.0;
  const n2 = typeof params.n2 === "number" ? params.n2 : 1.33;
  const topLabel = typeof params.top === "string" ? params.top : "air";
  const bottomLabel = typeof params.bottom === "string" ? params.bottom : "water";

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
      const cx = width / 2;
      const iy = height * 0.5; // interface height
      const L = Math.min(width, height) * 0.42;
      const theta1 = clamp(angleRef.current, 0, 88) * RAD;

      ctx.clearRect(0, 0, width, height);

      // Bottom medium tint (denser side reads heavier)
      ctx.fillStyle = `${accent}14`;
      ctx.fillRect(0, iy, width, height - iy);

      // Interface line
      ctx.strokeStyle = "#3a3a4a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, iy);
      ctx.lineTo(width, iy);
      ctx.stroke();

      // Normal (dashed)
      ctx.strokeStyle = "#3a3a4a";
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(cx, iy - L);
      ctx.lineTo(cx, iy + L);
      ctx.stroke();
      ctx.setLineDash([]);

      // Incident beam comes from the upper-left, angle θ1 from the normal.
      const inStart = { x: cx - L * Math.sin(theta1), y: iy - L * Math.cos(theta1) };
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.25;
      ctx.beginPath();
      ctx.moveTo(inStart.x, inStart.y);
      ctx.lineTo(cx, iy);
      ctx.stroke();

      // Refraction / total internal reflection
      const ratio = (n1 / n2) * Math.sin(theta1);
      const tir = ratio > 1;

      if (!tir) {
        const theta2 = Math.asin(ratio);
        const ref = { x: cx + L * Math.sin(theta2), y: iy + L * Math.cos(theta2) };
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.25;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(cx, iy);
        ctx.lineTo(ref.x, ref.y);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Faint reflected beam
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.moveTo(cx, iy);
        ctx.lineTo(cx + L * Math.sin(theta1), iy - L * Math.cos(theta1));
        ctx.stroke();
        ctx.globalAlpha = 1;

        // angle readout
        ctx.fillStyle = "#8a8a99";
        ctx.font = "11px var(--font-mono, monospace)";
        ctx.textAlign = "left";
        ctx.fillText(`in ${Math.round(theta1 * DEG)}°`, 10, iy - 12);
        ctx.textAlign = "right";
        ctx.fillText(`out ${Math.round(theta2 * DEG)}°`, width - 10, iy + 22);
      } else {
        // Total internal reflection: full-strength reflected beam, no exit ray
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.25;
        ctx.beginPath();
        ctx.moveTo(cx, iy);
        ctx.lineTo(cx + L * Math.sin(theta1), iy - L * Math.cos(theta1));
        ctx.stroke();

        ctx.fillStyle = accent;
        ctx.font = "600 11px var(--font-mono, monospace)";
        ctx.textAlign = "center";
        ctx.fillText("total internal reflection", cx, iy + 26);
        ctx.fillStyle = "#8a8a99";
        ctx.font = "11px var(--font-mono, monospace)";
        ctx.textAlign = "left";
        ctx.fillText(`in ${Math.round(theta1 * DEG)}°`, 10, iy - 12);
      }

      // Medium labels
      ctx.fillStyle = "#55556a";
      ctx.font = "10px var(--font-mono, monospace)";
      ctx.textAlign = "left";
      ctx.fillText(`${topLabel}  n ${n1.toFixed(2)}`, 10, 16);
      ctx.fillText(`${bottomLabel}  n ${n2.toFixed(2)}`, 10, height - 10);

      // Drag handle at the beam's origin
      ctx.beginPath();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.arc(inStart.x, inStart.y, 9, 0, Math.PI * 2);
      ctx.stroke();
    };

    const setFromPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const cx = width / 2;
      const iy = height * 0.5;
      // Only the upper medium drives the incident angle.
      const dx = px - cx;
      const dy = Math.min(py - iy, -1);
      angleRef.current = clamp(Math.atan2(Math.abs(dx), -dy) * DEG, 0, 88);
      draw();
    };

    let dragging = false;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      canvas.setPointerCapture(e.pointerId);
      setFromPointer(e);
    };
    const onMove = (e: PointerEvent) => {
      if (dragging) setFromPointer(e);
    };
    const onUp = () => {
      dragging = false;
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
  }, [accent, n1, n2, topLabel, bottomLabel]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative flex-1">
        <canvas ref={canvasRef} className="h-full w-full touch-none" />
      </div>
      <p className="label-mono mt-2 text-center text-faint">
        drag the beam to change its angle
      </p>
    </div>
  );
}
