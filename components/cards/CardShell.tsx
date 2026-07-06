import type { CSSProperties, ReactNode } from "react";
import type { Topic } from "@/lib/types";
import { TOPIC_ACCENT } from "@/lib/types";
import TopicChip from "../TopicChip";

export default function CardShell({
  topic,
  source,
  children,
}: {
  topic: Topic;
  source?: string;
  children: ReactNode;
  index?: number;
  total?: number;
}) {
  const style = { "--accent": TOPIC_ACCENT[topic] } as CSSProperties;
  return (
    <section
      className="feed-card relative flex h-[100dvh] w-full flex-col px-6 pt-[max(1.75rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      style={style}
    >
      <header className="flex items-center justify-between pr-12">
        <TopicChip topic={topic} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col justify-center">
        {children}
      </div>

      <footer className="min-h-[1.25rem]">
        {source ? (
          <p className="label-mono truncate text-[0.625rem] text-faint">
            {source}
          </p>
        ) : null}
      </footer>
    </section>
  );
}
