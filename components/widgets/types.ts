import type { WidgetParams } from "@/lib/types";

export type WidgetProps = {
  params: WidgetParams;
  running: boolean;
  /** Called by predict-reveal widgets once their reveal animation settles. */
  onResolve?: (result?: unknown) => void;
  /** Accent color (CSS value) for the owning card's topic. */
  accent?: string;
};
