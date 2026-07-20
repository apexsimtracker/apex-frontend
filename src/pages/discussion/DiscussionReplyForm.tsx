import { useEffect, type RefObject } from "react";
import DiscussionReplyCompose, {
  type DiscussionReplyComposeProps,
} from "@/pages/discussion/DiscussionReplyCompose";
import { useDiscussionReplyDock } from "@/pages/discussion/useDiscussionReplyDock";
import { cn } from "@/lib/utils";

type DiscussionReplyFormProps = DiscussionReplyComposeProps & {
  dockAnchorRef?: RefObject<HTMLElement | null>;
  onDockMetricsChange?: (metrics: {
    pinned: boolean;
    barHeight: number;
  }) => void;
};

export default function DiscussionReplyForm({
  dockAnchorRef,
  onDockMetricsChange,
  ...composeProps
}: DiscussionReplyFormProps) {
  const { slotRef, barRef, mode, barHeight } = useDiscussionReplyDock({
    dockAnchorRef,
  });
  const pinned = mode === "pinned";

  useEffect(() => {
    onDockMetricsChange?.({ pinned, barHeight });
  }, [pinned, barHeight, onDockMetricsChange]);

  return (
    <section aria-label="Add a reply" className="hidden pt-4 lg:block">
      <div ref={slotRef}>
        {pinned ? (
          <div
            aria-hidden
            className="pointer-events-none"
            style={{ height: barHeight }}
          />
        ) : null}
        <div
          ref={barRef}
          className={cn(
            "border-t border-apex-outline-variant/15 bg-apex-background/95 py-3 backdrop-blur-md",
            pinned ? "fixed inset-x-0 bottom-0 z-40" : "relative z-30",
          )}
        >
          <div className={cn(pinned && "mx-auto max-w-3xl px-6")}>
            <DiscussionReplyCompose {...composeProps} />
          </div>
        </div>
      </div>
    </section>
  );
}
