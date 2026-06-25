import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Pixellato" },
      { name: "description", content: "Pixellato is a small studio designing limited-edition objects." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-20 pb-24 md:pt-28">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">About</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">A studio for quiet design.</h1>
      <div className="mt-10 space-y-6 text-lg leading-relaxed text-foreground/80">
        <p>
          Pixellato makes a small number of objects each year. Each one is released on a schedule and then never reproduced.
          The intent is simple: better things, made slowly, kept for longer.
        </p>
        <p>
          Our materials are chosen with care — heavyweight cotton, Belgian linen, hand-finished porcelain. Construction is conservative.
          Detail is restrained.
        </p>
        <p>
          When a drop is gone, it's gone. The archive lives on with the people who wear it.
        </p>
      </div>
    </section>
  );
}
