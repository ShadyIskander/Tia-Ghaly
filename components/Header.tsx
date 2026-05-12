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
  const [scrolled,    setScrolled]    = useState(false);
  const [aboutOpen,   setAboutOpen]   = useState(false);
  const [showLabel,   setShowLabel]   = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);
  const iconRefs = useRef<Record<string, HTMLImageElement | null>>({});

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Show one-time "About" label on mobile after a short delay
  useEffect(() => {
    if (!isMobile) return;
    const alreadySeen = sessionStorage.getItem("about-label-seen");
    if (alreadySeen) return;
    const showTimer = setTimeout(() => {
      setShowLabel(true);
      sessionStorage.setItem("about-label-seen", "1");
    }, 1200);
    const hideTimer = setTimeout(() => setShowLabel(false), 5200);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isMobile]);

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
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.825); opacity: 0.8; }
          70%  { transform: scale(1.1); opacity: 0.4; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes label-fade {
          0%   { opacity: 0; transform: translateY(-4px); }
          15%  { opacity: 1; transform: translateY(0); }
          80%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
        .about-pulse-ring {
          position: absolute;
          inset: 0;
          margin: auto;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid currentColor;
          animation: pulse-ring 2.5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
          pointer-events: none;
          z-index: 10; /* Ensure ring is above the images */
        }
        .about-label-hint {
          position: absolute;
          top: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          white-space: nowrap;
          color: currentColor;
          opacity: 0;
          pointer-events: none;
          animation: label-fade 4s ease forwards;
          z-index: 20; /* Ensure label is above everything */
        }
      `}</style>

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
              position:      "fixed",
              top:           "0.5rem",
              right:         "0.5rem",
              pointerEvents: "all",
              zIndex:        999,
              width:         "80px",
              height:        "80px",
              borderRadius:  "50%",
              overflow:      "visible",
              display:       "flex",
              alignItems:    "center",
              justifyContent: "center",
              background:    "none",
              border:        "none",
              padding:       0,
              cursor:        "pointer",
              color:         "var(--muted)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {/* 1. Icon images (at the bottom) */}
            <span style={{ position: "relative", display: "block", width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", zIndex: 1 }}>
              {Object.entries(T_ICON_MAP).map(([label, src]) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={label}
                  ref={(el) => { iconRefs.current[label] = el; }}
                  src={src}
                  alt={label === "Blush" ? "Tia Ghaly" : ""}
                  style={{
                    position:    "absolute",
                    inset:       0,
                    width:       "100%",
                    height:      "100%",
                    objectFit:   "cover",
                    borderRadius: "50%",
                    display:     "block",
                    opacity:     label === "Blush" ? 1 : 0,
                    transition:  "opacity 0.25s ease",
                  }}
                />
              ))}
            </span>

            {/* 2. Single Pulse ring (layered on top of the images) */}
            <span className="about-pulse-ring" aria-hidden="true" />

            {/* 3. One-time "About" label on mobile (on top of everything) */}
            {showLabel && (
              <span className="about-label-hint" aria-hidden="true">
                About
              </span>
            )}
          </button>
        </div>
      </header>

      <About open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
