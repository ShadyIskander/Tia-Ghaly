"use client";

import { useEffect, useState } from "react";

export default function Contact() {
  const [themeLabel, setThemeLabel] = useState("Blush");

  useEffect(() => {
    setThemeLabel(localStorage.getItem("portfolio-bg-label") || "Blush");
    const handler = (e: Event) => setThemeLabel((e as CustomEvent<string>).detail);
    window.addEventListener("theme-logo", handler);
    return () => window.removeEventListener("theme-logo", handler);
  }, []);

  const palette = themeLabel === "Mint"
    ? {
        sectionBg: "#256f68",
        heading: "#ffffff",
        primary: "#ffffff",
        secondary: "#111111",
        border: "rgba(220,242,239,0.24)",
      }
    : themeLabel === "Yellow"
      ? {
          sectionBg: "#c79757",
          heading: "#ffffff",
          primary: "#ffffff",
          secondary: "#111111",
          border: "rgba(255,255,255,0.28)",
        }
      : themeLabel === "Coral"
        ? {
            sectionBg: "#d78e77",
            heading: "#ffffff",
            primary: "#ffffff",
            secondary: "#111111",
            border: "rgba(255,255,255,0.28)",
          }
        : {
            sectionBg: "#c8c8ca",
            heading: "#ffffff",
            primary: "#ffffff",
            secondary: "#111111",
            border: "rgba(27,27,29,0.2)",
          };

  return (
    <footer
      id="contact"
      style={{
        marginTop: "6rem",
        background: palette.sectionBg,
        borderTop: `1px solid ${palette.border}`,
      }}
    >
      <div
        style={{
          maxWidth: "1800px",
          margin: "0 auto",
          padding: "1.35rem 2.5rem 1.45rem",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: "1.25rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: "clamp(1.15rem, 2.4vw, 1.85rem)",
              fontWeight: 500,
              letterSpacing: "-0.005em",
              textTransform: "uppercase",
              lineHeight: 1,
              margin: "0 0 0.72rem",
              color: palette.heading,
              opacity: 0.92,
            }}
          >
            Let&apos;s work together
          </h2>

          <a
            href="mailto:tiaghaly@gmail.com"
            style={{
              display: "inline-block",
              fontSize: "clamp(0.52rem, 0.72vw, 0.68rem)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              borderBottom: `1px solid ${palette.primary}`,
              paddingBottom: "2px",
              transition: "opacity 0.2s",
              color: palette.primary,
              opacity: 0.9,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.4")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            tiaghaly@gmail.com
          </a>

          <div
            style={{
              marginTop: "0.62rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.28rem",
              alignItems: "center",
            }}
          >
            <a
              href="https://www.instagram.com/tiaadelghaly/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "clamp(0.48rem, 0.66vw, 0.62rem)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: palette.secondary,
                transition: "opacity 0.2s",
                opacity: 0.86,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Instagram
            </a>

            <a
              href="https://www.linkedin.com/in/tia-sourial-52614b368?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "clamp(0.48rem, 0.66vw, 0.62rem)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: palette.secondary,
                transition: "opacity 0.2s",
                opacity: 0.86,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              LinkedIn
            </a>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            borderTop: `1px solid ${palette.border}`,
            paddingTop: "1.15rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "clamp(0.45rem, 0.58vw, 0.56rem)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: palette.primary,
              opacity: 0.58,
            }}
          >
            © 2026 Tia Ghaly — All rights reserved
          </span>

          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{
              fontSize: "clamp(0.45rem, 0.58vw, 0.56rem)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: palette.primary,
              opacity: 0.58,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.58")}
          >
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
