"use client";

import { useState, useEffect } from "react";

const COLORS = [
  { hex: "#fdf6f0", label: "Blush" },
  { hex: "#9dddd5", label: "Mint" },
  { hex: "#ffe5a4", label: "Yellow" },
  { hex: "#f5846f", label: "Coral" },
];

const STORAGE_KEY = "portfolio-bg";

// Arc geometry — swatches fan from upper-left to left around the button
const CONTAINER   = 230;
const BTN_SIZE    = 52;
const SWATCH_SIZE = 32;
const RADIUS      = 96;
const BTN_CX      = CONTAINER - BTN_SIZE / 2;  // 194
const BTN_CY      = CONTAINER - BTN_SIZE / 2;  // 194
const ANGLES      = [175, 145, 115, 90]; // spread 4 swatches in arc

function arcPos(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    top:  BTN_CY - RADIUS * Math.sin(rad) - SWATCH_SIZE / 2,
    left: BTN_CX + RADIUS * Math.cos(rad) - SWATCH_SIZE / 2,
  };
}

export default function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      document.documentElement.style.setProperty("--bg", saved);
      document.documentElement.style.setProperty("--background", saved);
      document.body.style.backgroundColor = saved;
      setActive(saved);
    }
  }, []);

  const pick = (hex: string, label: string) => {
    // Set on both :root and body to ensure all consumers pick it up
    document.documentElement.style.setProperty("--bg", hex);
    document.documentElement.style.setProperty("--background", hex);
    document.body.style.backgroundColor = hex;
    localStorage.setItem(STORAGE_KEY, hex);
    localStorage.setItem(STORAGE_KEY + "-label", label);
    window.dispatchEvent(new CustomEvent("theme-logo", { detail: label }));
    setActive(hex);
    setOpen(false);
  };

  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const show = () => setHidden(false);
    const hide = () => setHidden(true);
    window.addEventListener("about-open",  hide);
    window.addEventListener("about-close", show);
    return () => {
      window.removeEventListener("about-open",  hide);
      window.removeEventListener("about-close", show);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      style={{
        position:      "fixed",
        bottom:        "1.25rem",
        right:         "1.25rem",
        width:         CONTAINER,
        height:        CONTAINER,
        zIndex:        9999,
        pointerEvents: "none",  // transparent to clicks except on children
      }}
    >
      {/* Arc colour swatches */}
      {COLORS.map((c, i) => {
        const pos = arcPos(ANGLES[i]);
        return (
          <button
            key={c.hex}
            title={c.label}
            onClick={() => pick(c.hex, c.label)}
            style={{
              position:     "absolute",
              top:          pos.top,
              left:         pos.left,
              width:        SWATCH_SIZE,
              height:       SWATCH_SIZE,
              borderRadius: "50%",
              background:   c.hex,
              border:       "none",
              cursor:        "pointer",
              boxShadow:     active === c.hex
                ? "inset 0 2px 6px rgba(0,0,0,0.25)"
                : "0 4px 16px rgba(0,0,0,0.18)",
              outline:       "none",
              opacity:       open ? 1 : 0,
              transform:     open
                ? active === c.hex ? "scale(0.88)" : "scale(1)"
                : "scale(0.3)",
              transition:    `transform 0.25s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease, box-shadow 0.2s ease`,
              transitionDelay: open
                ? `${i * 0.05}s`
                : `${(COLORS.length - 1 - i) * 0.04}s`,
              pointerEvents: open ? "auto" : "none",
            }}
            onMouseEnter={e => { if (open && active !== c.hex) e.currentTarget.style.transform = "scale(1.12)"; }}
            onMouseLeave={e => { if (open) e.currentTarget.style.transform = active === c.hex ? "scale(0.88)" : "scale(1)"; }}
          />
        );
      })}

      {/* Palette button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Change background colour"
        style={{
          position:            "absolute",
          bottom:              0,
          right:               0,
          width:               BTN_SIZE,
          height:              BTN_SIZE,
          borderRadius:        "50%",
          background:          "rgba(210,210,210,0.65)",
          backdropFilter:      "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border:              "none",
          cursor:              "pointer",
          display:             "flex",
          alignItems:          "center",
          justifyContent:      "center",
          boxShadow:           "0 4px 20px rgba(0,0,0,0.18)",
          transition:          "transform 0.2s",
          outline:             "none",
          pointerEvents:       "auto",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        {/* Solid filled palette icon */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#0a0a0a">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10 1.1 0 2-.9 2-2 0-.52-.2-1-.52-1.36-.31-.35-.5-.83-.5-1.32 0-1.1.9-2 2-2h2.36C19.73 15.32 22 13 22 10c0-4.42-4.48-8-10-8zm-5 9c-.83 0-1.5-.67-1.5-1.5S6.17 8 7 8s1.5.67 1.5 1.5S7.83 11 7 11zm3-4c-.83 0-1.5-.67-1.5-1.5S9.17 4 10 4s1.5.67 1.5 1.5S10.83 7 10 7zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 4 14 4s1.5.67 1.5 1.5S14.83 7 14 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.17 8 17 8s1.5.67 1.5 1.5S17.83 11 17 11z"/>
        </svg>
      </button>
    </div>
  );
}
