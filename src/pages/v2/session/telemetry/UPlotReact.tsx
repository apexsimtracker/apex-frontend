import { useEffect, useRef } from "react";
import uPlot, { type AlignedData, type Options } from "uplot";
import "uplot/dist/uPlot.min.css";

type UPlotReactProps = {
  options: Options;
  data: AlignedData;
  className?: string;
  /** Shared uPlot sync key — charts with the same key share cursor/scale. */
  syncKey?: string;
};

/**
 * Minimal React wrapper that keeps high-frequency series out of React state.
 * Only recreates the chart when options identity or length change meaningfully.
 */
export default function UPlotReact({
  options,
  data,
  className,
  syncKey,
}: UPlotReactProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const plotRef = useRef<uPlot | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const width = el.clientWidth || options.width || 600;
    const syncedOptions: Options = {
      ...options,
      width,
      cursor: {
        ...options.cursor,
        ...(syncKey
          ? { sync: { key: syncKey, setSeries: true } }
          : {}),
      },
    };

    const plot = new uPlot(syncedOptions, dataRef.current, el);
    plotRef.current = plot;

    const ro = new ResizeObserver(() => {
      if (!rootRef.current || !plotRef.current) return;
      plotRef.current.setSize({
        width: rootRef.current.clientWidth,
        height: options.height ?? plotRef.current.height,
      });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      plot.destroy();
      plotRef.current = null;
    };
    // Recreate only when series schema / height / sync change; data updates separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options serialized via keys below
  }, [options.height, options.series?.length, syncKey]);

  useEffect(() => {
    plotRef.current?.setData(data);
  }, [data]);

  return <div ref={rootRef} className={className} />;
}
