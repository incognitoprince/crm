import { useEffect, useRef, useState, type ReactNode } from "react";

/** Shows fixed-width content (the A4 invoice) scaled down to fit narrow screens.
 *  The scaling is visual only; exports always use the unscaled element. */
export function FitToWidth({ width, children, className = "" }: { width: number; children: ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const measure = () => {
      if (!outer.current || !inner.current || outer.current.clientWidth === 0) return;
      const s = Math.min(1, outer.current.clientWidth / width);
      setScale(s);
      setHeight(inner.current.offsetHeight * s);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={outer} className={"invoice-fit mx-auto w-full " + className} style={{ maxWidth: width, height }}>
      <div ref={inner} className="invoice-fit-inner" style={{ width, transform: "scale(" + scale + ")", transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
