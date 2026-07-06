"use client";

import type { WidgetName, WidgetParams } from "@/lib/types";
import type { WidgetProps } from "./types";
import MoonDistance from "./MoonDistance";
import ScaleZoom from "./ScaleZoom";
import DeepTime from "./DeepTime";
import GravityToy from "./GravityToy";

const REGISTRY: Record<WidgetName, React.ComponentType<WidgetProps>> = {
  moonDistance: MoonDistance,
  scaleZoom: ScaleZoom,
  deepTime: DeepTime,
  gravityToy: GravityToy,
};

export default function Widget({
  widget,
  params,
  running,
  onResolve,
  accent,
}: {
  widget: WidgetName;
  params: WidgetParams;
  running: boolean;
  onResolve?: (result?: unknown) => void;
  accent?: string;
}) {
  const Component = REGISTRY[widget];
  if (!Component) return null;
  return (
    <Component
      params={params}
      running={running}
      onResolve={onResolve}
      accent={accent}
    />
  );
}
