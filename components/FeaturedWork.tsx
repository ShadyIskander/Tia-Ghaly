"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── Arc geometry ────────────────────────────────────────────────────────────
// Cards sit on the circumference of a huge circle whose centre is far ABOVE
// the viewport — so the visible arc is the BOTTOM portion of the circle.
// The centre card is at the lowest point; outer cards rise upward and fan out.
const CARD_W   = 260;
const CARD_H   = 340;
const RADIUS   = 1000;  // px — large radius → flat-looking arc
const STEP     = 26;    // degrees between adjacent cards on the circle
const LERP_T   = 0.10;  // follow speed — mouse position drives angle directly

const N         = 5;
const MAX_ANGLE = (N - 1) * STEP;   // 104° — full range of wheel rotation
const MID_ANGLE = MAX_ANGLE / 2;    //  52° — centre card shown on load
// How far the centre card sits below the edge cards on the inverted arc
const ARC_LIFT  = Math.round(RADIUS * (1 - Math.cos((MID_ANGLE * Math.PI) / 180)));

const featuredProjects = [
  {
    title: "Nike",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80",
  },
  {
    title: "Shake Shack",
    img: "https://images.unsplash.com/photo-1561758033-7e924f619b47?w=900&auto=format&fit=crop&q=80",
  },
  {
    title: "Caulfield Cup",
    img: "https://images.unsplash.com/photo-1636955816868-fcb881e57954?w=900&auto=format&fit=crop&q=80",
  },
  {
    title: "Jaffa",
    img: "https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?w=900&auto=format&fit=crop&q=80",
  },
  {
    title: "Frugo",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop&q=80",
  },
];

export default function FeaturedWork() {
  const sectionRef = useRef<HTMLElement>(null);

  // `angle` drives the render; targetRef is set directly from mouse X position.
  const [angle, setAngle] = useState(MID_ANGLE);
  const targetRef         = useRef(MID_ANGLE);
  const currentRef        = useRef(MID_ANGLE);
  const rafRef            = useRef<number | null>(null);
  const insideRef         = useRef(false);

  // ── Lerp loop — follows mouse position smoothly ───────────────────────────
  const lerpLoop = useCallback(() => {
    const diff = targetRef.current - currentRef.current;
    if (Math.abs(diff) < 0.015) {
      currentRef.current = targetRef.current;
      setAngle(targetRef.current);
      rafRef.current = null;
      return;
    }
    currentRef.current += diff * LERP_T;
    setAngle(currentRef.current);
    rafRef.current = requestAnimationFrame(lerpLoop);
  }, []);

  // ── Mouse X directly sets the target angle ────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;
      const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      targetRef.current = t * MAX_ANGLE;
      if (!rafRef.current) rafRef.current = requestAnimationFrame(lerpLoop);
    },
    [lerpLoop],
  );

  // ── On leave: snap to nearest card ───────────────────────────────────────
  const handleMouseLeave = useCallback(() => {
    insideRef.current = false;
    const nearest = Math.round(currentRef.current / STEP) * STEP;
    targetRef.current = Math.max(0, Math.min(MAX_ANGLE, nearest));
    if (!rafRef.current) rafRef.current = requestAnimationFrame(lerpLoop);
  }, [lerpLoop]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // The card whose angle is closest to 0° is the "active" (centre) card
  const activeIdx = Math.max(0, Math.min(N - 1, Math.round(angle / STEP)));

  return (
    <section
      ref={sectionRef}
      id="work"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        padding: "6rem 0 0",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "4rem", padding: "0 2rem" }}>
        <h2
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 900,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            margin: "0 0 0.6rem",
            lineHeight: 1,
            color: "var(--fg)",
          }}
        >
          Featured Work
        </h2>
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.1em", color: "var(--muted)", margin: 0 }}>
          Select recent and notable projects
        </p>
      </div>

      {/* ── Circular arc carousel ─────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          height: ARC_LIFT + CARD_H + 72,
          overflow: "hidden",
        }}
      >
        {featuredProjects.map((project, i) => {
          // Angle of this card on the circle (0° = straight up / centre)
          const aDeg     = i * STEP - angle;
          const aRad     = (aDeg * Math.PI) / 180;

          // Position on the BOTTOM arc — centre card at ARC_LIFT (lowest), edges near 0 (highest)
          const cx       = RADIUS * Math.sin(aRad);
          const cy       = ARC_LIFT - RADIUS * (1 - Math.cos(aRad));

          const absDiff  = Math.abs(aDeg / STEP);            // "distance" from centre in card units
          const isActive = i === activeIdx;

          return (
            <div
              key={i}
              style={{
                position:        "absolute",
                // cx is relative to the section's horizontal centre
                left:            `calc(50% + ${cx - CARD_W / 2}px)`,
                top:             cy,
                width:           CARD_W,
                height:          CARD_H,
                borderRadius:    "16px",
                overflow:        "hidden",
                // Rotate around the card's own bottom-centre so it fans outward
                transformOrigin: "center bottom",
                transform:       `rotate(${aDeg}deg)`,
                zIndex:          Math.round((N - absDiff) * 10),
                opacity:         Math.max(0.5, 1 - absDiff * 0.15),
                boxShadow:       isActive
                  ? "0 24px 64px rgba(0,0,0,0.18)"
                  : "0 6px 20px rgba(0,0,0,0.06)",
                transition:      "opacity 0.25s, box-shadow 0.25s",
                willChange:      "transform",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.img}
                alt={project.title}
                loading="lazy"
                style={{
                  width:         "100%",
                  height:        "100%",
                  objectFit:     "cover",
                  display:       "block",
                  pointerEvents: "none",
                }}
              />
            </div>
          );
        })}

        {/* Pill label — always centred under the active card */}
        <div
          style={{
            position:      "absolute",
            bottom:        0,
            left:          "50%",
            transform:     "translateX(-50%)",
            whiteSpace:    "nowrap",
            pointerEvents: "none",
            zIndex:        200,
          }}
        >
          <span
            key={activeIdx}
            style={{
              display:       "inline-block",
              fontSize:      "0.85rem",
              fontWeight:    600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color:         "var(--fg)",
              background:    "rgba(10,10,10,0.08)",
              padding:       "0.45rem 1.1rem",
              borderRadius:  "999px",
              animation:     "fw-fade-in 0.35s ease both",
            }}
          >
            {featuredProjects[activeIdx].title}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fw-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
