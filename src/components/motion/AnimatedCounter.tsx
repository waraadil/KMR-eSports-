"use client";

import { useEffect, useRef } from "react";
import { useInView, animate } from "framer-motion";

export default function AnimatedCounter({
  to,
  prefix = "",
  suffix = "",
  duration = 1.8,
  className,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) {
          ref.current.textContent = `${prefix}${new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 0,
          }).format(v)}${suffix}`;
        }
      },
    });
    return () => controls.stop();
  }, [inView, to, prefix, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
