"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const CARD_W  = 200;
const CARD_H  = 200;
const RADIUS  = 500;
const STEP    = 22;    // degrees between cards — tighter spacing for 8 cards
const LERP_T  = 0.10;

const projects = [
  { title: "Stephanson I",   img: "/stephanson-1.png" },
  { title: "Stephanson II",  img: "/stephanson-2.png" },
  { title: "Stephanson III", img: "/stephanson-3.png" },
  { title: "Stephanson IV",  img: "/stephanson-4.png" },
  { title: "Stephanson V",   img: "/stephanson-5.png" },
];

const N         = projects.length;  // 5
const MAX_ANGLE = (N - 1) * STEP;
const MID_ANGLE = MAX_ANGLE / 2;
// Bowl arc: how far the centre card sits below the edge cards
const ARC_LIFT  = Math.round(RADIUS * (1 - Math.cos((MID_ANGLE * Math.PI) / 180)));

export default function MoreWork() {
  const sectionRef  = useRef<HTMLElement>(null);
  const [angle, setAngle]           = useState(MID_ANGLE);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const targetRef   = useRef(MID_ANGLE);
  const currentRef  = useRef(MID_ANGLE);
  const rafRef      = useRef<number | null>(null);

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

  const handleMouseLeave = useCallback(() => {
    setHoveredIdx(null);
    const nearest = Math.round(currentRef.current / STEP) * STEP;
    targetRef.current = Math.max(0, Math.min(MAX_ANGLE, nearest));
    if (!rafRef.current) rafRef.current = requestAnimationFrame(lerpLoop);
  }, [lerpLoop]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const activeIdx = Math.max(0, Math.min(N - 1, Math.round(angle / STEP)));

  return (
    <section
      ref={sectionRef}
      id="more"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ padding: "3rem 0 0", overflow: "hidden", userSelect: "none", backgroundColor: "var(--bg)" }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1rem", padding: "0 2rem" }}>
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
          About Me
        </h2>
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.1em", color: "var(--muted)", margin: 0 }}>
          Take a scroll, stay a while
        </p>
      </div>

      {/* Arc carousel */}
      <div style={{ position: "relative", height: ARC_LIFT + CARD_H + 72, overflow: "hidden" }}>
        {projects.map((project, i) => {
          const aDeg    = i * STEP - angle;
          const aRad    = (aDeg * Math.PI) / 180;
          const cx      = RADIUS * Math.sin(aRad);
          // Bowl: centre card lowest (ARC_LIFT), edges rise toward 0
          const cy      = ARC_LIFT - RADIUS * (1 - Math.cos(aRad));
          const absDiff = Math.abs(aDeg / STEP);
          const isHovered = hoveredIdx === i;

          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              style={{
                position:        "absolute",
                left:            `calc(50% + ${cx - CARD_W / 2}px)`,
                top:             cy,
                width:           CARD_W,
                height:          CARD_H,
                borderRadius:    "20px",
                overflow:        "hidden",
                transformOrigin: "center bottom",
                zIndex:          Math.round((N - absDiff) * 10),
                opacity:         1,
                boxShadow:       isHovered
                  ? "0 28px 70px rgba(0,0,0,0.22)"
                  : "0 8px 24px rgba(0,0,0,0.08)",
                transition:      "box-shadow 0.3s",
                cursor:          "pointer",
                willChange:      "transform",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.img}
                alt={project.title}
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
              />
            </div>
          );
        })}

        {/* Pill label */}
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
            key={hoveredIdx ?? activeIdx}
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
              animation:     "mw-fade-in 0.35s ease both",
            }}
          >
            {projects[hoveredIdx ?? activeIdx].title}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes mw-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
