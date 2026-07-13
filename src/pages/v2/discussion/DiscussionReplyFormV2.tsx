import { useEffect, type RefObject } from "react";
import DiscussionReplyComposeV2, {
  type DiscussionReplyComposeV2Props,
} from "@/pages/v2/discussion/DiscussionReplyComposeV2";
import { useDiscussionReplyDock } from "@/pages/v2/discussion/useDiscussionReplyDock";
import { cn } from "@/lib/utils";

type DiscussionReplyFormV2Props = DiscussionReplyComposeV2Props & {
  dockAnchorRef?: RefObject<HTMLElement | null>;
  onDockMetricsChange?: (metrics: {
    pinned: boolean;
    barHeight: number;
  }) => void;
};

export default function DiscussionReplyFormV2({
  dockAnchorRef,
  onDockMetricsChange,
  ...composeProps
}: DiscussionReplyFormV2Props) {
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
            "border-t border-v2-outline-variant/15 bg-v2-background/95 py-3 backdrop-blur-md",
            pinned ? "fixed inset-x-0 bottom-0 z-40" : "relative z-30",
          )}
        >
          <div className={cn(pinned && "mx-auto max-w-3xl px-6")}>
            <DiscussionReplyComposeV2 {...composeProps} />
          </div>
        </div>
      </div>
    </section>
  );
}
