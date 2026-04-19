"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

const CARD_W    = 220;
const CARD_H    = 220;
const STIFFNESS = 0.10;
const DAMPING   = 0.75;

interface Project {
  title:       string;
  description: string;
  postDescription?: string;
  img:         string;
  images:      string[];
}

const projects: Project[] = [
  {
    title:       "Inside Outside",
    description: "Featured in ASTERISM 2023 and the Past Forward Coventry University End of Year Showcase 2024, this project used the Enneagram personality test to explore the link between personality traits and self expression.",
    postDescription: "Friends and family took the test and illustrated their interpretations of \"inside vs. outside.\" The drawings were then grouped by personality type and assigned to fabric strands, each with the \"inside\" artwork on the inner side and the \"outside\" on the outer. We set out to see if people with the same personality type express themselves in similar visual ways, and to our surprise, over 60% chose the strand that matched their type",
    img:         "/inside-out.png",
    images:      ["/inside-cards-44.png", "/inside-cards-46.png", "/inside-cards-47.png", "/inside-cards-48.png", "/inside-cards-50.png", "/inside-cards-51.png"],
  },
  {
    title:       "Stephanson",
    description: "English typeface design and calligraphy, a custom lettering system built from the ground up, blending tradition with a contemporary visual language.",
    postDescription: "Stephanson is a Latin Egyptian display typeface that merges mid-century elegance with the expressive spirit of Cairo's street lettering. Inspired by a 1940s hand-lettered Revlon poster, it comes in two versions: a distinctive solid variant and a distinctive outlined variant. While both share the same structural foundation, each offers unique visual characters that sets them apart.",
    img:         "/revlon.png",
    images:      ["/type-image-1.png", "/type-image-2.jpg", "/type-image-3.jpg", "/type-image-4.jpg", "/type-image-5.jpg"],
  },
  {
    title:       "Corona",
    description: "Packaging design and brand identity for Corona's Ghazala, a reimagining of the original Corona Dark Chocolate for a new generation.",
    postDescription: "The main product, dark chocolate, was presented through two distinct packaging designs aimed at specific demographics in different countries. One targeting millennials in Egypt and the other targeting millennials in Poland through storytelling.",
    img:         "/corona.png",
    images:      ["/package-corona-1.png", "/package-corona-2.png", "/package-corona-3.png", "/package-corona-4.png", "/package-corona-5.png", "/package-corona-6.png"],
  },
];

export default function ProjectsList() {
  const [hoveredIdx,  setHoveredIdx]  = useState<number | null>(null);
  const [activeImg,   setActiveImg]   = useState(0);
  const [openIdx,     setOpenIdx]     = useState<number | null>(null);
  const [mounted,     setMounted]     = useState(false);
  const [themeLabel,  setThemeLabel]  = useState("Blush");
  const [isMobile,    setIsMobile]    = useState(false);
  const [modalImgIdx, setModalImgIdx] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setThemeLabel(localStorage.getItem("portfolio-bg-label") || "Blush");
    const handler = (e: Event) => setThemeLabel((e as CustomEvent<string>).detail);
    window.addEventListener("theme-logo", handler);
    return () => window.removeEventListener("theme-logo", handler);
  }, []);

  const sectionRef = useRef<HTMLElement>(null);
  const cardRef    = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number | null>(null);
  const posRef     = useRef({ x: 0, y: 0 });
  const velRef     = useRef({ x: 0, y: 0 });
  const targetRef  = useRef({ x: 0, y: 0 });

  useEffect(() => {
    document.body.style.overflow = openIdx !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [openIdx]);

  // Reset modal image index when opening a project
  useEffect(() => {
    if (openIdx !== null) setModalImgIdx(0);
  }, [openIdx]);

  // Auto-advance carousel on mobile every 3 seconds; resets on manual tap
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetAutoPlay = useCallback((images: string[]) => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setModalImgIdx(i => (i + 1) % images.length);
    }, 3000);
  }, []);

  useEffect(() => {
    if (!isMobile || openIdx === null) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }
    const images = projects[openIdx].images;
    resetAutoPlay(images);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [isMobile, openIdx, resetAutoPlay]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenIdx(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const springLoop = useCallback(() => {
    const dx = targetRef.current.x - posRef.current.x;
    const dy = targetRef.current.y - posRef.current.y;
    velRef.current.x = velRef.current.x * DAMPING + dx * STIFFNESS;
    velRef.current.y = velRef.current.y * DAMPING + dy * STIFFNESS;
    posRef.current.x += velRef.current.x;
    posRef.current.y += velRef.current.y;
    const tilt = Math.max(-12, Math.min(12, velRef.current.x * 2.5));
    if (cardRef.current) {
      cardRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px) rotate(${tilt}deg)`;
    }
    const settled = Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && Math.abs(velRef.current.x) < 0.05 && Math.abs(velRef.current.y) < 0.05;
    if (settled) { rafRef.current = null; return; }
    rafRef.current = requestAnimationFrame(springLoop);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    targetRef.current = { x: e.clientX - rect.left - CARD_W / 2, y: e.clientY - rect.top - CARD_H * 0.75 };
    if (!rafRef.current) rafRef.current = requestAnimationFrame(springLoop);
  }, [springLoop, isMobile]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const openProject = projects[openIdx ?? 0];
  const isStephansonProject = openProject.title === "Stephanson";

  const accentColor = themeLabel === "Yellow" ? "#f8b868"
                    : themeLabel === "Coral"  ? "#f8b090"
                    : themeLabel === "Mint"   ? "#2fada0"
                    : "var(--muted)";

  return (
    <>
      <section
        ref={sectionRef}
        id="projects-list"
        onMouseMove={handleMouseMove}
        style={{ padding: isMobile ? "4rem 0" : "8rem 0", position: "relative", overflow: "hidden", userSelect: "none", backgroundColor: "var(--bg)" }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "0 1.25rem" : "0 3rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: accentColor, margin: "0 0 2.5rem", textAlign: "center" }}>
            Projects
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {projects.map((p, i) => (
              <li
                key={i}
                onMouseEnter={() => { setHoveredIdx(i); setActiveImg(i); }}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setOpenIdx(i)}
                style={{
                  fontFamily:    "var(--font-oswald), sans-serif",
                  fontSize:      isMobile ? "clamp(2.2rem, 12vw, 3.5rem)" : "clamp(3rem, 6.5vw, 6rem)",
                  fontWeight:    900,
                  textTransform: "uppercase",
                  letterSpacing: "-0.02em",
                  lineHeight:    1.05,
                  textAlign:     "center",
                  color:         hoveredIdx === null || hoveredIdx === i
                                   ? (themeLabel === "Blush" ? "var(--fg)" : "#ffffff")
                                   : (themeLabel === "Blush" ? "var(--muted)" : "rgba(255,255,255,0.35)"),
                  cursor:        "pointer",
                  transition:    "color 0.25s ease",
                  padding:       "0.1rem 0",
                }}
              >
                {p.title}
              </li>
            ))}
          </ul>
        </div>

        {/* Floating hover card — desktop only */}
        {!isMobile && (
          <div
            ref={cardRef}
            style={{
              position: "absolute", top: 0, left: 0,
              width: CARD_W, height: CARD_H,
              borderRadius: "20px", overflow: "hidden",
              pointerEvents: "none", zIndex: 100,
              opacity: hoveredIdx !== null ? 1 : 0,
              transition: "opacity 0.25s ease",
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
              willChange: "transform",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={projects[activeImg].img} alt={projects[activeImg].title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        )}
      </section>

      {/* Modal */}
      {mounted && openIdx !== null && createPortal(
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            animation: "modal-backdrop-in 0.3s ease both",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: isMobile ? "0" : "2vh 2vw",
              backgroundColor: "#fdf6f0",
              borderRadius: isMobile ? "0" : "20px",
              overflowY: "auto",
              boxShadow: "0 40px 120px rgba(0,0,0,0.4)",
              animation: "modal-in 0.4s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setOpenIdx(null)}
              style={{
                position: "fixed",
                top: "1rem", right: "1rem",
                width: "2.5rem", height: "2.5rem",
                borderRadius: "50%", border: "none",
                background: "rgba(10,10,10,0.12)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.25rem", color: "#0a0a0a",
                zIndex: 10,
              }}
              aria-label="Close"
            >
              ✕
            </button>

            <div style={{ padding: isMobile ? "3rem 1.25rem 4rem" : "4rem 3rem 5rem", clear: "both" }}>
              {/* Title */}
              <h2
                style={{
                  fontFamily: "var(--font-oswald), sans-serif",
                  fontSize: "clamp(2rem, 7vw, 5rem)",
                  fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "-0.01em", textAlign: "center",
                  margin: "0 0 1.25rem", color: "var(--fg)",
                }}
              >
                {openProject.title}
              </h2>

              {/* Description */}
              <p style={{
                fontSize: "clamp(0.9rem, 1.6vw, 1.1rem)",
                lineHeight: 1.85, letterSpacing: "0.2px",
                color: "var(--muted)", textAlign: "center",
                maxWidth: "900px", margin: "0 auto 2.5rem", fontWeight: 400,
              }}>
                {openProject.description}
              </p>

              {/* Image grid — desktop */}
              {!isMobile && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "1rem",
                  maxWidth: "68%",
                  margin: "0 auto",
                }}>
                  {openProject.images.map((src, j) => {
                    const colSpan = isStephansonProject ? (j === 0 ? 4 : 2) : (j < 2 ? 2 : 1);
                    const aspectRatio = isStephansonProject ? (j === 0 ? "2 / 3" : "1 / 1") : "1 / 1";
                    return (
                      <div key={j} style={{ gridColumn: `span ${colSpan}`, borderRadius: "16px", overflow: "hidden", aspectRatio, background: "#e8e2d9" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`${openProject.title} ${j + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Image carousel — mobile */}
              {isMobile && (
                <div style={{ position: "relative", width: "100%", marginBottom: "1.5rem" }}>
                  <div style={{ borderRadius: "16px", overflow: "hidden", aspectRatio: "1/1", background: "#e8e2d9" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={openProject.images[modalImgIdx]}
                      alt={`${openProject.title} ${modalImgIdx + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                  {/* Prev / Next */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
                    <button
                      onClick={() => { setModalImgIdx(i => Math.max(0, i - 1)); resetAutoPlay(openProject.images); }}
                      disabled={modalImgIdx === 0}
                      style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", opacity: modalImgIdx === 0 ? 0.3 : 1, color: "var(--fg)" }}
                    >‹</button>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                      {modalImgIdx + 1} / {openProject.images.length}
                    </span>
                    <button
                      onClick={() => { setModalImgIdx(i => Math.min(openProject.images.length - 1, i + 1)); resetAutoPlay(openProject.images); }}
                      disabled={modalImgIdx === openProject.images.length - 1}
                      style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", opacity: modalImgIdx === openProject.images.length - 1 ? 0.3 : 1, color: "var(--fg)" }}
                    >›</button>
                  </div>
                  {/* Dots */}
                  <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", marginTop: "0.5rem" }}>
                    {openProject.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setModalImgIdx(i)}
                        style={{
                          width: "6px", height: "6px", borderRadius: "50%", border: "none", padding: 0, cursor: "pointer",
                          background: i === modalImgIdx ? "var(--fg)" : "var(--muted)", opacity: i === modalImgIdx ? 1 : 0.4,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {openProject.postDescription && (
                <p style={{
                  fontSize: "clamp(0.9rem, 1.6vw, 1.1rem)",
                  lineHeight: 1.85, letterSpacing: "0.2px",
                  color: "var(--muted)", textAlign: "center",
                  maxWidth: "900px", margin: "2.5rem auto 0", fontWeight: 400,
                }}>
                  {openProject.postDescription}
                </p>
              )}
            </div>
          </div>
        </div>
      , document.body)}

      <style>{`
        @keyframes modal-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modal-in { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </>
  );
}
