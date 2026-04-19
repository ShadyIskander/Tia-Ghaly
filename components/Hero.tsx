"use client";

import { useEffect, useRef, useState } from "react";

// Three overlapping cards arranged like a fanned deck, centred in the hero
const cards = [
  {
    src: "/website-cards-content-44.png",
    alt: "Website cards content 44",
    baseX: -100, rotate: -9, zIndex: 1,
  },
  {
    src: "/website-cards-content-53.png",
    alt: "Website cards content 53",
    baseX: 0, rotate: 3, zIndex: 3,
  },
  {
    src: "/cornona-3.png",
    alt: "Cornona 3",
    baseX: 100, rotate: -5, zIndex: 2,
  },
];

// Per-card physics state — matches spencergabor.com internals exactly:
// impulse velocity (mouse kick) + independent spring (returns to 0,0)
function makeCardState() {
  return { vx: 0, vy: 0, sx: 0, sy: 0, svx: 0, svy: 0 };
}

const LOGO_MAP: Record<string, string> = {
  Blush:  "/name-logo-blush.png",
  Mint:   "/name-logo-mint.png",
  Yellow: "/name-logo-yellow.png",
  Coral:  "/name-logo-coral.png",
};
const LOGO_STORAGE_KEY = "portfolio-bg-label";

export default function Hero() {
  const sectionRef  = useRef<HTMLElement>(null);
  const cardsRef    = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number | null>(null);
  const lastPtr     = useRef({ x: 0, y: 0 });
  const cardStates  = useRef(cards.map(makeCardState));
  const [offsets, setOffsets] = useState(cards.map(() => ({ x: 0, y: 0 })));
  const logoRefs = useRef<Record<string, HTMLImageElement | null>>({});
  const [themeLabel, setThemeLabel] = useState("Blush");

  // Initialize logos from saved theme and listen for live changes via direct DOM update
  // (no React state → no re-render delay, swap is synchronous with CSS bg change)
  useEffect(() => {
    const labels = Object.keys(LOGO_MAP);
    const saved = localStorage.getItem(LOGO_STORAGE_KEY) || "Blush";
    labels.forEach(label => {
      const img = logoRefs.current[label];
      if (img) img.style.opacity = label === saved ? "1" : "0";
    });
    setThemeLabel(saved);
    const handler = (e: Event) => {
      const newLabel = (e as CustomEvent<string>).detail;
      labels.forEach(label => {
        const img = logoRefs.current[label];
        if (img) img.style.opacity = label === newLabel ? "1" : "0";
      });
      setThemeLabel(newLabel);
    };
    window.addEventListener("theme-logo", handler);
    return () => window.removeEventListener("theme-logo", handler);
  }, []);

  // ── rAF physics loop ────────────────────────────────────────
  // Exact constants from spencergabor.com: stiffness=0.05, damping=0.8, vel-friction=0.9
  useEffect(() => {
    const STIFFNESS = 0.05;
    const DAMPING   = 0.8;
    const VEL_DECAY = 0.9;

    const tick = () => {
      const next = cardStates.current.map((s) => {
        // 1. Decay mouse-impulse velocity
        s.vx *= VEL_DECAY;
        s.vy *= VEL_DECAY;
        // 2. Inject impulse into spring position (bypass spring smoothing)
        s.sx += s.vx;
        s.sy += s.vy;
        // 3. Spring pulls sx/sy back toward (0, 0)
        s.svx = s.svx * DAMPING + (0 - s.sx) * STIFFNESS;
        s.svy = s.svy * DAMPING + (0 - s.sy) * STIFFNESS;
        s.sx += s.svx;
        s.sy += s.svy;
        // Round to 2dp to avoid sub-pixel thrash
        s.sx = Math.round(s.sx * 100) / 100;
        s.sy = Math.round(s.sy * 100) / 100;
        return { x: s.sx, y: s.sy };
      });
      setOffsets(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Pointer tracking — exact spencergabor.com math ─────────
  useEffect(() => {
    let active = false;

    const onMove = (e: MouseEvent) => {
      const el = cardsRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pad = 60;

      const outside =
        e.clientX < rect.left  - pad || e.clientX > rect.right  + pad ||
        e.clientY < rect.top   - pad || e.clientY > rect.bottom + pad;

      if (outside) {
        active = false;
        lastPtr.current = { x: e.clientX, y: e.clientY };
        return;
      }

      const movX = active ? e.clientX - lastPtr.current.x : 0;
      const movY = active ? e.clientY - lastPtr.current.y : 0;
      active = true;
      lastPtr.current = { x: e.clientX, y: e.clientY };

      const containerCx = rect.left + rect.width  / 2;
      const containerCy = rect.top  + rect.height / 2;

      cards.forEach((card, i) => {
        // Exact spencergabor.com distance formula
        const cardCx = containerCx + card.baseX;
        const cardCy = containerCy;
        const dx = (e.clientX - cardCx) / window.innerWidth  * 2;
        const dy = (e.clientY - cardCy) / window.innerHeight * 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Exact spencergabor.com: 6th-power falloff × 0.4
        const influence = Math.max(0, Math.pow(1 - dist, 6)) * 0.4;
        cardStates.current[i].vx += movX * influence;
        cardStates.current[i].vy += movY * influence;
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const accentColor = themeLabel === "Yellow" ? "#f8b868"
                    : themeLabel === "Coral"  ? "#f8b090"
                    : themeLabel === "Mint"   ? "#2fada0"
                    : "var(--muted)";  // Blush → grey

  return (
    <section
      ref={sectionRef}
      id="hero"
      style={{
        position: "relative",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "center",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "80px 2rem 3rem",
        backgroundColor: "var(--bg)",
      }}
    >
      {/* ── Top meta: location + email ───────────────────────── */}
      <div>
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--fg)", fontWeight: 700 }}>
          Cairo, Egypt
        </p>
        <p style={{ fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: accentColor, fontWeight: 700, marginTop: "0.3rem" }}>
          tiaghaly@gmail.com
        </p>
      </div>

      {/* ── Center block: name → cards → role ───────────────── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0" }}>

        {/* Name — all 4 logos pre-loaded in DOM; direct DOM opacity = synchronous with CSS bg change */}
        <div style={{ position: "relative", width: "520px", maxWidth: "92vw", aspectRatio: "1960 / 850", marginBottom: "1.5rem" }}>
          {Object.entries(LOGO_MAP).map(([label, src]) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={label}
              ref={(el) => { logoRefs.current[label] = el; }}
              src={src}
              alt={label === "Blush" ? "Tia Ghaly" : ""}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                userSelect: "none",
                display: "block",
                opacity: label === "Blush" ? 1 : 0,  // SSR default; useEffect corrects on mount
                pointerEvents: "none",
              }}
            />
          ))}
        </div>

        {/* Cards + Role sub-group */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2.5rem" }}>

        {/* Three fanned cards */}
        <div ref={cardsRef} style={{ position: "relative", width: "520px", maxWidth: "92vw", height: "200px", cursor: "default" }}>
          {cards.map((card, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 200,
                height: 200,
                transform: `translateX(calc(-50% + ${card.baseX * 1.3}px + ${offsets[i].x}px)) translateY(calc(-50% + ${offsets[i].y}px)) rotate(${card.rotate}deg)`,
                willChange: "transform",
                borderRadius: "20px",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
                pointerEvents: "none",
                zIndex: card.zIndex,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.src}
                alt={card.alt}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter: card.src === "/cornona-3.png" ? "brightness(1.2) saturate(1.12) sepia(0.18)" : undefined,
                }}
              />
            </div>
          ))}
        </div>

        </div>
      </div>

      {/* ── Clients ──────────────────────────────────────────── */}
      <div style={{ textAlign: "center" }}>
        <p className="section-label" style={{ marginBottom: "0.3rem", color: "#0a0a0a", fontSize: "0.75rem", letterSpacing: "0.15em", fontWeight: 700 }}>Coventry University</p>
        <p style={{ fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: accentColor, fontWeight: 700 }}>
          Graduate
        </p>
      </div>
    </section>
  );
}
