import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProjectsList from "@/components/ProjectsList";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <>
      <Header />

      <main>
        {/* Hero — no reveal delay, it IS the first view */}
        <Hero />

        {/* Projects List */}
        <ScrollReveal>
          <ProjectsList />
        </ScrollReveal>

        <div style={{ height: "260px", background: "var(--bg)" }} aria-hidden="true" />
      </main>
    </>
  );
}
