"use client";

import { useEffect, useRef, useState } from "react";
import About from "./About";

const T_ICON_MAP: Record<string, string> = {
  Blush:  "/t-icon-blush.png",
  Mint:   "/t-icon-mint.png",
  Yellow: "/t-icon-yellow.png",
  Coral:  "/t-icon-coral.png",
};

export default function Header() {
  const [scrolled,   setScrolled]   = useState(false);
  const [aboutOpen,  setAboutOpen]  = useState(false);
  const iconRefs = useRef<Record<string, HTMLImageElement | null>>({});

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Swap icon in sync with theme changes — direct DOM, no re-render
  useEffect(() => {
    const labels = Object.keys(T_ICON_MAP);
    const saved  = localStorage.getItem("portfolio-bg-label") || "Blush";
    labels.forEach(l => {
      const el = iconRefs.current[l];
      if (el) el.style.opacity = l === saved ? "1" : "0";
    });
    const handler = (e: Event) => {
      const next = (e as CustomEvent<string>).detail;
      labels.forEach(l => {
        const el = iconRefs.current[l];
        if (el) el.style.opacity = l === next ? "1" : "0";
      });
    };
    window.addEventListener("theme-logo", handler);
    return () => window.removeEventListener("theme-logo", handler);
  }, []);

  return (
    <>
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0.5rem 0",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        {/* T icon — top right, swaps with theme, opens About */}
        <button
          onClick={() => setAboutOpen(v => !v)}
          aria-label="About Tia Ghaly"
          style={{
            position:    "fixed",
            top:         "0.5rem",
            right:       "0.5rem",
            pointerEvents: "all",
            zIndex:      999,
            width:       "80px",
            height:      "80px",
            borderRadius: "50%",
            overflow:    "hidden",
            display:     "block",
            background:  "none",
            border:      "none",
            padding:     0,
            cursor:      "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {Object.entries(T_ICON_MAP).map(([label, src]) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={label}
              ref={(el) => { iconRefs.current[label] = el; }}
              src={src}
              alt={label === "Blush" ? "Tia Ghaly" : ""}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
                display: "block",
                opacity: label === "Blush" ? 1 : 0,
                transition: "opacity 0.25s ease",
              }}
            />
          ))}
        </button>
      </div>
    </header>

    <About open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
