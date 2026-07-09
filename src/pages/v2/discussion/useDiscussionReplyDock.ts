import { useEffect, useRef, useState, type RefObject } from "react";

export type DiscussionReplyDockMode = "pinned" | "docked";

type UseDiscussionReplyDockResult = {
    slotRef: RefObject<HTMLDivElement>;
    barRef: RefObject<HTMLDivElement>;
    mode: DiscussionReplyDockMode;
    barHeight: number;
};

export function useDiscussionReplyDock(
    dockAnchorRef: RefObject<HTMLDivElement | null>,
): UseDiscussionReplyDockResult {
    const slotRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<DiscussionReplyDockMode>("pinned");
    const [barHeight, setBarHeight] = useState(0);
    const lastScrollYRef = useRef(0);
    const modeRef = useRef<DiscussionReplyDockMode>("pinned");

    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    useEffect(() => {
        const bar = barRef.current;
        if (!bar) return;

        const mq = window.matchMedia("(min-width: 1024px)");

        const update = () => {
            if (!mq.matches) {
                setMode("pinned");
                return;
            }

            const height = bar.offsetHeight;
            setBarHeight(height);

            const dockAnchor = dockAnchorRef.current;
            if (!dockAnchor) return;

            const vh = window.innerHeight;
            const scrollY = window.scrollY;
            const scrollingUp = scrollY < lastScrollYRef.current;
            const scrollingDown = scrollY > lastScrollYRef.current;
            lastScrollYRef.current = scrollY;

            const dockAnchorTop = dockAnchor.getBoundingClientRect().top;
            const barBottom = bar.getBoundingClientRect().bottom;
            const currentMode = modeRef.current;
            const viewportBottomTouch =
                Math.abs(barBottom - vh) <= 4;

            if (
                currentMode === "pinned" &&
                dockAnchorTop < vh &&
                scrollingDown
            ) {
                setMode("docked");
                return;
            }

            if (
                currentMode === "docked" &&
                scrollingUp &&
                viewportBottomTouch
            ) {
                setMode("pinned");
            }
        };

        const ro = new ResizeObserver(update);
        ro.observe(bar);
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        mq.addEventListener("change", update);
        lastScrollYRef.current = window.scrollY;
        update();

        return () => {
            ro.disconnect();
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
            mq.removeEventListener("change", update);
        };
    }, [dockAnchorRef]);

    return { slotRef, barRef, mode, barHeight };
}
