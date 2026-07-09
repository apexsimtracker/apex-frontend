import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const COLLAPSED_MAX_HEIGHT_PX = 160;
const EXPAND_STEP_PX = 160;

type DiscussionCommentBodyV2Props = {
    body: string;
};

export default function DiscussionCommentBodyV2({
    body,
}: DiscussionCommentBodyV2Props) {
    const contentRef = useRef<HTMLParagraphElement>(null);
    const [maxHeightPx, setMaxHeightPx] = useState(COLLAPSED_MAX_HEIGHT_PX);
    const [fullHeightPx, setFullHeightPx] = useState(0);

    useLayoutEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        setFullHeightPx(el.scrollHeight);
        setMaxHeightPx(COLLAPSED_MAX_HEIGHT_PX);
    }, [body]);

    const isFullyExpanded = maxHeightPx >= fullHeightPx;
    const isClamped = fullHeightPx > COLLAPSED_MAX_HEIGHT_PX;
    const showViewMore = isClamped && !isFullyExpanded;

    const handleViewMore = () => {
        setMaxHeightPx((prev) =>
            Math.min(prev + EXPAND_STEP_PX, fullHeightPx),
        );
    };

    return (
        <div className="relative">
            <p
                ref={contentRef}
                className={cn(
                    "whitespace-pre-wrap font-v2-body text-sm leading-relaxed text-v2-on-surface-variant",
                    isClamped && !isFullyExpanded && "overflow-hidden",
                )}
                style={
                    isClamped && !isFullyExpanded
                        ? { maxHeight: maxHeightPx }
                        : undefined
                }
            >
                {body}
            </p>
            {showViewMore && (
                <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-v2-surface-container-low to-transparent"
                    aria-hidden
                />
            )}
            {showViewMore ? (
                <button
                    type="button"
                    onClick={handleViewMore}
                    className="relative mt-2 font-v2-body text-xs font-medium text-v2-primary underline underline-offset-2 transition-colors hover:text-v2-primary/80"
                >
                    View more
                </button>
            ) : null}
        </div>
    );
}
