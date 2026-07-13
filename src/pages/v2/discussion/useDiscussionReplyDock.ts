import { useEffect, useRef, useState, type RefObject } from "react";

export type DiscussionReplyDockMode = "pinned" | "docked";

const DOCK_TOUCH_PX = 8;
const PAGE_SCROLL_THRESHOLD_PX = 8;

type UseDiscussionReplyDockOptions = {
  dockAnchorRef?: RefObject<HTMLElement | null>;
};

type UseDiscussionReplyDockResult = {
  slotRef: RefObject<HTMLDivElement>;
  barRef: RefObject<HTMLDivElement>;
  mode: DiscussionReplyDockMode;
  barHeight: number;
};

function inViewportBottomTouchZone(bottom: number, vh: number): boolean {
  return Math.abs(bottom - vh) <= DOCK_TOUCH_PX;
}

function pageCanScroll(vh: number): boolean {
  return (
    document.documentElement.scrollHeight > vh + PAGE_SCROLL_THRESHOLD_PX
  );
}

/**
 * Auto-dock without user scroll — short pages, or initial layout when the slot
 * is already in view. Intentionally excludes the touch-zone case while the user
 * has scrolled down on a long thread, so scroll-up repin is not immediately undone.
 */
function shouldAutoDock(
  vh: number,
  slotBottom: number,
  scrollY: number,
): boolean {
  if (!pageCanScroll(vh)) return true;
  return (
    scrollY <= PAGE_SCROLL_THRESHOLD_PX &&
    slotBottom <= vh + DOCK_TOUCH_PX
  );
}

export function useDiscussionReplyDock(
  options: UseDiscussionReplyDockOptions = {},
): UseDiscussionReplyDockResult {
  const { dockAnchorRef } = options;
  const slotRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<DiscussionReplyDockMode>("pinned");
  const [barHeight, setBarHeight] = useState(0);
  const lastScrollYRef = useRef(0);
  const lastSlotBottomRef = useRef<number | null>(null);
  const modeRef = useRef<DiscussionReplyDockMode>("pinned");
  const observedAnchorRef = useRef<HTMLElement | null>(null);

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
        lastSlotBottomRef.current = null;
        return;
      }

      const height = bar.offsetHeight;
      setBarHeight(height);

      const slot = slotRef.current;
      if (!slot) return;

      const vh = window.innerHeight;
      const scrollY = window.scrollY;
      const scrollingUp = scrollY < lastScrollYRef.current;
      const scrollingDown = scrollY > lastScrollYRef.current;
      lastScrollYRef.current = scrollY;

      const slotBottom = slot.getBoundingClientRect().bottom;
      const prevSlotBottom = lastSlotBottomRef.current ?? slotBottom;
      lastSlotBottomRef.current = slotBottom;

      const currentMode = modeRef.current;
      const inTouchZone = inViewportBottomTouchZone(slotBottom, vh);

      const crossedDownThroughDockLine =
        prevSlotBottom > vh + DOCK_TOUCH_PX && slotBottom <= vh + DOCK_TOUCH_PX;

      const crossedUpThroughDockLine =
        prevSlotBottom < vh - DOCK_TOUCH_PX && slotBottom >= vh - DOCK_TOUCH_PX;

      const crossedUpFromBelowViewport =
        prevSlotBottom > vh + DOCK_TOUCH_PX && slotBottom <= vh + DOCK_TOUCH_PX;

      // Short-page / initial in-view slot: keep reply bar in document flow.
      if (currentMode === "pinned" && shouldAutoDock(vh, slotBottom, scrollY)) {
        setMode("docked");
        return;
      }

      // Docked while the natural slot is still below the viewport — bar would be off-screen.
      if (currentMode === "docked" && slotBottom > vh + DOCK_TOUCH_PX) {
        setMode("pinned");
        return;
      }

      if (
        currentMode === "pinned" &&
        scrollingDown &&
        (inTouchZone || crossedDownThroughDockLine)
      ) {
        setMode("docked");
        return;
      }

      if (currentMode === "docked" && scrollingUp) {
        const shouldRepin =
          inTouchZone || crossedUpThroughDockLine || crossedUpFromBelowViewport;

        if (shouldRepin) {
          setMode("pinned");
        }
      }
    };

    const ro = new ResizeObserver(() => {
      const anchor = dockAnchorRef?.current ?? null;
      if (anchor && anchor !== observedAnchorRef.current) {
        if (observedAnchorRef.current) {
          ro.unobserve(observedAnchorRef.current);
        }
        ro.observe(anchor);
        observedAnchorRef.current = anchor;
      }
      update();
    });
    ro.observe(bar);

    const slot = slotRef.current;
    if (slot) ro.observe(slot);

    const initialAnchor = dockAnchorRef?.current ?? null;
    if (initialAnchor) {
      ro.observe(initialAnchor);
      observedAnchorRef.current = initialAnchor;
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    mq.addEventListener("change", update);
    lastScrollYRef.current = window.scrollY;
    lastSlotBottomRef.current = null;
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
