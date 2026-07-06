import type { Topic } from "@/lib/types";
import { TOPIC_LABEL, TOPIC_ACCENT } from "@/lib/types";

export default function TopicChip({ topic }: { topic: Topic }) {
  return (
    <span className="label-mono inline-flex items-center gap-2 text-muted">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: TOPIC_ACCENT[topic] }}
        aria-hidden
      />
      {TOPIC_LABEL[topic]}
    </span>
  );
}
