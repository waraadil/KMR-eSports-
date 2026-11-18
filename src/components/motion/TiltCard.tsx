"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Subtle 3D tilt on hover for feature cards. */
export default function TiltCard({
  children,
  className,
  max = 6,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(900px) rotateX(0deg) rotateY(0deg)");

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(
      `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setTransform("perspective(900px) rotateX(0deg) rotateY(0deg)")}
      style={{ transform, transformStyle: "preserve-3d" }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
