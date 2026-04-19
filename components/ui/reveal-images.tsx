"use client";

interface ProjectCard {
  src: string;
  alt: string;
  rotate: number;
  baseX: number;
  zIndex: number;
}

function RevealImageList() {
  const cards: ProjectCard[] = [
    {
      src: "https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?w=400&auto=format&fit=crop&q=80",
      alt: "Branding",
      rotate: -8,
      baseX: -140,
      zIndex: 1,
    },
    {
      src: "https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=400&auto=format&fit=crop&q=80",
      alt: "Web design",
      rotate: 2,
      baseX: 0,
      zIndex: 3,
    },
    {
      src: "https://images.unsplash.com/photo-1575995872537-3793d29d972c?w=400&auto=format&fit=crop&q=80",
      alt: "Illustration",
      rotate: 10,
      baseX: 140,
      zIndex: 2,
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        paddingTop: "8rem",
        paddingBottom: "8rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0",
        backgroundColor: "var(--bg)",
      }}
    >
      {/* PROJECTS label */}
      <p
        style={{
          fontSize: "0.75rem",
          fontWeight: 900,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--fg)",
          marginBottom: "2.5rem",
        }}
      >
        Projects
      </p>

      {/* Fanned cards */}
      <div style={{ position: "relative", width: "520px", maxWidth: "92vw", height: "200px" }}>
        {cards.map((card, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 200,
              height: 200,
              transform: `translateX(calc(-50% + ${card.baseX}px)) translateY(-50%) rotate(${card.rotate}deg)`,
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
              zIndex: card.zIndex,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.src}
              alt={card.alt}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export { RevealImageList };

