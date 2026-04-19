"use client";

import { useEffect, useRef, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3;
  className?: string;
  style?: React.CSSProperties;
}

const delayClass: Record<number, string> = {
  0: "",
  1: "reveal-delay-1",
  2: "reveal-delay-2",
  3: "reveal-delay-3",
};

export default function ScrollReveal({
  children,
  delay = 0,
  className = "",
  style,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const classes = ["reveal", delayClass[delay], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes} style={style}>
      {children}
    </div>
  );
}
