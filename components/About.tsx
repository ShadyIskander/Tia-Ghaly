"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  open:    boolean;
  onClose: () => void;
}

const BIOS = {
  short: `Graphic designer and experience creator based in Cairo, Egypt. Coventry University graduate. My work lives at the intersection of human interaction, analogue tasks, and immersive experiences. I focus on brand strategy, lettering and typography, exhibition design, and packaging.`,
  personal: `I believe in design rooted in culture, shaped by curiosity, and built to last. Specifically drawn to projects that demand both conceptual depth and strong craft work that has something to say, and says it beautifully.`,
  detailed: `I believe design should mean something.  
Every project whether packaging, type, or installation must carry weight, intention, and resonance.

I was raised between two languages and two scripts.  
That duality gave me a lifelong love for the visual, for the way words and forms can connect across boundaries.

Design is not decoration.  
It is culture, creativity, and human connection sparking something new every single day.

This is my practice.  
To craft work that bridges, that speaks, that matters.`,
};

const ACCORDION_ITEMS = [
  { key: "short",    label: "Short and Simple" },
  { key: "personal", label: "Personal & conceptual" },
  { key: "detailed", label: "Detailed & excessive" },
] as const;

const CAMP_PHOTOS = [
  "/about-camps/camp-1.jpg",
  "/about-camps/camp-2.jpg",
  "/about-camps/camp-3.jpg",
  "/about-camps/camp-4.jpg",
  "/about-camps/camp-5.jpg",
  "/about-camps/camp-6.jpg",
];

const CAMP_VIDEOS = [
  "/about-camps/shooting-1.mov",
  "/about-camps/shooting-2.mov",
  "/about-camps/shooting-3.mov",
];

function shufflePhotos(photos: string[]) {
  const arr = [...photos];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function About({ open, onClose }: Props) {
  const [mounted,     setMounted]     = useState(false);
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [campPhotos,  setCampPhotos]  = useState<string[]>(CAMP_PHOTOS);
  const [campIndex,   setCampIndex]   = useState(0);
  const [videoIndex,  setVideoIndex]  = useState(0);

  // Always neutral grey — About page is theme-independent
  const accentColor = "#ababab";

  useEffect(() => { setMounted(true); }, []);

  // Hide ThemeToggle while About is open
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(open ? "about-open" : "about-close"));
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Shuffle camp photos each time About opens
  useEffect(() => {
    if (!open) return;
    setCampPhotos(shufflePhotos(CAMP_PHOTOS));
    setCampIndex(0);
    setVideoIndex(0);
  }, [open]);

  // Rotate photos in the vertical polaroid
  useEffect(() => {
    if (!open || campPhotos.length === 0) return;
    const id = window.setInterval(() => {
      setCampIndex((prev) => (prev + 1) % campPhotos.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [open, campPhotos]);

  if (!mounted || !open) return null;

  const toggle = (key: string) =>
    setExpanded(prev => (prev === key ? null : key));
  const currentVideo = CAMP_VIDEOS[videoIndex % CAMP_VIDEOS.length];

  return createPortal(
    <div
      style={{
        position:        "fixed",
        inset:           0,
        zIndex:          998,
        backgroundColor: "#fdf6f0",
        overflowY:       "auto",
        animation:       "aboutFadeIn 0.3s ease",
      }}
    >
      <style>{`
        @keyframes aboutFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 720px) {
          .about-grid-top  { grid-template-columns: 1fr !important; }
          .about-grid-cols { grid-template-columns: 1fr !important; }
          .about-loves-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Close button ─────────────────────────────────────── */}
      <button
        onClick={onClose}
        style={{
          position:    "fixed",
          top:         "1.3rem",
          left:        "1.5rem",
          background:  "none",
          border:      "none",
          cursor:      "pointer",
          fontSize:    "0.6rem",
          fontWeight:  700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color:       "var(--fg)",
          fontFamily:  "var(--font-sans)",
          zIndex:      999,
          padding:     "0.4rem 0",
          opacity:     0.7,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
      >
        ← Close
      </button>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "7rem 3rem 6rem" }}>

        {/* ── Things Tia Loves ─────────────────────────────── */}
        <div
          className="about-loves-grid"
          style={{
            display:             "grid",
            gridTemplateColumns: "1fr 1fr",
            gap:                 "4rem",
            alignItems:          "start",
            marginBottom:        "5rem",
          }}
        >
          {/* Notebook list */}
          <div
            style={{
              background:   "#faf9e8",
              border:       "1px solid #e0ddb5",
              padding:      "2rem 2rem 2rem 3.5rem",
              position:     "relative",
              boxShadow:    "3px 4px 18px rgba(0,0,0,0.10)",
              lineHeight:   1.8,
            }}
          >
            {/* Red margin line */}
            <div style={{ position: "absolute", left: "2.5rem", top: 0, bottom: 0, width: "2px", background: "#f4a0a0", opacity: 0.7 }} />
            {/* Ruled lines */}
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${3.2 + i * 1.78}rem`, height: "1px", background: "#d6e4f7", opacity: 0.6 }} />
            ))}

            <h2
              style={{
                fontFamily:   "var(--font-oswald), sans-serif",
                fontSize:     "clamp(1.2rem, 2vw, 1.6rem)",
                fontWeight:   900,
                lineHeight:   1.1,
                marginBottom: "1.2rem",
                color:        "#1a1a1a",
                position:     "relative",
              }}
            >
              THINGS<br />TIA GHALY<br />
              <span style={{ color: "#f5846f" }}>LOVES:</span>
            </h2>

            <ol
              style={{
                listStyle:    "decimal",
                paddingLeft:  "1.2rem",
                margin:       0,
                display:      "flex",
                flexDirection: "column",
                gap:          "0.15rem",
                position:     "relative",
              }}
            >
              {[
                "Babies and sunshine",
                "Sat7 Kids show prep chaos",
                "Calligraphy & lettering",
                "Interactive packaging",
                "Voice acting for animated films",
                "Cairo street type",
                "Oswald bold headlines",
                "Anything technical or analogue",
                "Cooking for loved ones",
                "Unity in diversity",
              ].map((item, i) => (
                <li key={i} style={{ fontSize: "0.88rem", color: "#2a2a2a", fontFamily: "var(--font-sans)" }}>
                  {item}
                </li>
              ))}
            </ol>

            <p style={{ fontSize: "0.55rem", color: accentColor, marginTop: "1.2rem", letterSpacing: "0.12em", textTransform: "uppercase", position: "relative" }}>
              A VERY PERSONAL LIST BY TIA GHALY
            </p>
          </div>

          {/* Scattered polaroids */}
          <div style={{ position: "relative", minHeight: "660px" }}>
            {/* Polaroid 1 */}
            <div style={{ position: "absolute", top: "12px", left: "3%", background: "#fff", padding: "0.9rem 0.9rem 3.1rem", boxShadow: "0 8px 26px rgba(0,0,0,0.13)", transform: "rotate(-2.5deg)", width: "45%", zIndex: 2 }}>
              <div style={{ width: "100%", aspectRatio: "3/4", background: "#efefef", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={campPhotos[campIndex]}
                  alt="Camp moments"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    objectPosition: "center",
                    display: "block",
                    transition: "opacity 0.25s ease",
                    background: "#efefef",
                  }}
                />
              </div>
              <p style={{ marginTop: "0.6rem", fontFamily: "Georgia, serif", fontSize: "0.75rem", color: "#444", textAlign: "center", lineHeight: 1.4 }}>
                Toddlers enjoy arts and crafts; I enjoy arts and camps.
              </p>
            </div>

            {/* Polaroid 2 */}
            <div style={{ position: "absolute", top: "62px", left: "42%", background: "#fff", padding: "0.9rem 0.9rem 2.6rem", boxShadow: "0 8px 26px rgba(0,0,0,0.12)", transform: "rotate(2.5deg)", width: "54%", zIndex: 3 }}>
              <div style={{ width: "100%", aspectRatio: "4/3", background: "#dfe7e4", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <video
                  key={currentVideo}
                  src={currentVideo}
                  autoPlay
                  muted
                  playsInline
                  preload="metadata"
                  onEnded={() => setVideoIndex((prev) => (prev + 1) % CAMP_VIDEOS.length)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    background: "#dfe7e4",
                  }}
                />
              </div>
              <p style={{ marginTop: "0.6rem", fontFamily: "Georgia, serif", fontSize: "0.75rem", color: "#444", textAlign: "center", lineHeight: 1.4 }}>
                Precious shooting moments!
              </p>
            </div>

            {/* Polaroid 3 */}
            <div style={{ position: "absolute", top: "344px", left: "19%", background: "#fff", padding: "0.9rem 0.9rem 3rem", boxShadow: "0 8px 26px rgba(0,0,0,0.12)", transform: "rotate(-1deg)", width: "46%", zIndex: 4 }}>
              <div style={{ width: "100%", aspectRatio: "3/4", background: "#ede8dd", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/about-camps/on-set.png"
                  alt="Tia on set"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    display: "block",
                  }}
                />
              </div>
              <p style={{ marginTop: "0.6rem", fontFamily: "Georgia, serif", fontSize: "0.75rem", color: "#444", textAlign: "center", lineHeight: 1.4 }}>
                This is me on set enjoying life!!
              </p>
            </div>
          </div>
        </div>

        {/* ── Three columns ─────────────────────────────────── */}
        <div
          className="about-grid-cols"
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap:                 "3rem",
            borderTop:           "1px solid var(--border)",
            paddingTop:          "4rem",
          }}
        >
          {/* Column 1: Education · Exhibitions · Awards */}
          <div>
            <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--fg)" }}>
              Education
            </h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
              {[
                { title: "Coventry University", detail: "BA Graphic Design — Class of 2026" },
                { title: "British Ramses School of Egypt", detail: "British Diploma — Class of 2022" },
                { title: "New Ramses College", detail: "Sep 2009 – June 2015" },
              ].map((item, i) => (
                <li key={i} style={{ fontSize: "0.865rem", color: "var(--fg)", lineHeight: 1.65 }}>
                  <span style={{ fontWeight: 700 }}>{item.title}</span><br />
                  <span style={{ color: accentColor }}>{item.detail}</span>
                </li>
              ))}
            </ul>

            <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--fg)" }}>
              Exhibitions
            </h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
              {[
                { title: "Beyond", detail: "Coventry University End-of-Year Showcase 2025" },
                { title: "Past Forward", detail: "Coventry University End-of-Year Showcase 2024" },
                { title: "Asterism", detail: "Coventry University End-of-Year Showcase 2023" },
              ].map((item, i) => (
                <li key={i} style={{ fontSize: "0.865rem", color: "var(--fg)", lineHeight: 1.65 }}>
                  <span style={{ fontWeight: 700 }}>{item.title}</span><br />
                  <span style={{ color: accentColor }}>{item.detail}</span>
                </li>
              ))}
            </ul>

            <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--fg)" }}>
              Awards
            </h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
              <li style={{ fontSize: "0.865rem", color: "var(--fg)", lineHeight: 1.65 }}>
                <span style={{ fontWeight: 700 }}>Highest Sociology Achiever in Egypt</span><br />
                <span style={{ color: accentColor }}>Cambridge IGCSE Certificate</span>
              </li>
            </ul>
          </div>

          {/* Column 2: Experience · Skills */}
          <div>
            <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--fg)" }}>
              Experience
            </h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "1.2rem", marginBottom: "2.5rem" }}>
              {[
                { title: "TV Presenter", detail: "Sat7 Kids Channel — 2018–Present", sub: "Jesus Is Our Strength · Cup Cake · City Of The Stars · Chato" },
                { title: "Arabic Voice-Over Actor / Singer", detail: "Disney / Netflix / Blue Sky Studio — 2016–Present", sub: "Barbie · Vampirina · The Emoji Movie · Ice Age 5 · Finding Dory · Malibu Rescue · No Good Nick" },
                { title: "Class Student Representative", detail: "Coventry University — Sept 2022–Oct 2024", sub: "Advocated for student needs with department head" },
                { title: "Scouts' Coach", detail: "Wadi Sport Camp, Egypt — 2019–Present", sub: "Guided teenagers through experiential activities" },
                { title: "Educational Interventions", detail: "Egyptian Ministry of Education × Discovery Channel — 2018", sub: "Actress for multimedia science curriculum; presented to President El-Sisi" },
              ].map((item, i) => (
                <li key={i} style={{ fontSize: "0.865rem", color: "var(--fg)", lineHeight: 1.65 }}>
                  <span style={{ fontWeight: 700 }}>{item.title}</span><br />
                  <span style={{ color: accentColor }}>{item.detail}</span><br />
                  <span style={{ color: accentColor, fontSize: "0.8rem" }}>{item.sub}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Bio accordion + Get in Touch */}
          <div>
            <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.2rem", color: "var(--fg)" }}>
              Choose how you get to know me
            </h2>

            {ACCORDION_ITEMS.map(({ key, label }) => (
              <div key={key} style={{ borderBottom: "1px solid var(--border)" }}>
                <button
                  onClick={() => toggle(key)}
                  style={{
                    width:          "100%",
                    display:        "flex",
                    justifyContent: "space-between",
                    alignItems:     "center",
                    padding:        "0.85rem 0",
                    background:     "none",
                    border:         "none",
                    cursor:         "pointer",
                    fontFamily:     "var(--font-oswald), sans-serif",
                    fontSize:       "1rem",
                    fontWeight:     500,
                    color:          "var(--fg)",
                    textAlign:      "left",
                  }}
                >
                  <span>{label}</span>
                  <span style={{ fontSize: "1.2rem", lineHeight: 1, color: accentColor }}>
                    {expanded === key ? "−" : "+"}
                  </span>
                </button>
                {expanded === key && (
                  <p
                    style={{
                      fontSize:      "0.865rem",
                      color:         "var(--fg)",
                      lineHeight:    1.8,
                      paddingBottom: "1.1rem",
                      whiteSpace:    "pre-line",
                      opacity:       0.85,
                    }}
                  >
                    {BIOS[key as keyof typeof BIOS]}
                  </p>
                )}
              </div>
            ))}

            <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: "1.5rem", fontWeight: 700, marginTop: "2.5rem", marginBottom: "1.5rem", color: "var(--fg)" }}>
              Get in Touch
            </h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {[
                { value: "tiaghaly@gmail.com", href: "mailto:tiaghaly@gmail.com" },
                { value: "Instagram", href: "https://www.instagram.com/tiaadelghaly/" },
                { value: "LinkedIn", href: "https://www.linkedin.com/in/tia-sourial-52614b368?utm_source=share_via&utm_content=profile&utm_medium=member_ios" },
                { value: "Cairo, Egypt", href: undefined },
              ].map((item, i) => (
                <li key={i} style={{ fontSize: "0.865rem", lineHeight: 1.65 }}>
                  {item.href ? (
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      style={{
                        color: "var(--fg)",
                        fontWeight: 600,
                        textDecoration: "underline",
                      }}
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span style={{ color: "var(--fg)", fontWeight: 600 }}>{item.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
