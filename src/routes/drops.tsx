import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { Countdown } from "@/components/store/Countdown";
import { useProducts } from "@/lib/queries";
import { formatPrice, productImage } from "@/lib/products";

export const Route = createFileRoute("/drops")({
  head: () => ({
    meta: [
      { title: "Upcoming Drops — Pixellato" },
      { name: "description", content: "Scheduled releases. Get notified when each drop goes live." },
    ],
  }),
  component: Drops,
});

function Drops() {
  const { data: products = [] } = useProducts();
  const upcoming = products.filter((p) => p.status === "upcoming");

  return (
    <section className="mx-auto max-w-7xl px-6 pt-16 pb-24 md:pt-24">
      <div className="max-w-3xl">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Schedule</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Upcoming Drops</h1>
        <p className="mt-4 text-muted-foreground">Each drop is released at a specific time. The page updates live.</p>
      </div>

      <div className="mt-14 space-y-6">
        {upcoming.map((p, i) => (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="grid items-center gap-8 overflow-hidden rounded-3xl bg-surface-muted/60 md:grid-cols-[1fr_1.2fr] md:gap-12"
          >
            <div className="aspect-[4/3] overflow-hidden bg-surface-muted md:aspect-[5/6]">
              <img
                src={productImage(p.slug, p.image_url)}
                alt={p.title}
                loading="lazy"
                width={1280}
                height={1600}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="px-6 pb-10 md:px-12 md:py-12">
              {p.category && <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{p.category}</div>}
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{p.title}</h2>
              <p className="mt-3 max-w-md text-muted-foreground">{p.description}</p>
              <div className="mt-2 text-base font-medium tabular-nums">{formatPrice(Number(p.price))}</div>
              {p.release_time && (
                <div className="mt-6 rounded-2xl border border-border bg-background p-6">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Drops in</div>
                  <div className="mt-3"><Countdown to={p.release_time} /></div>
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background">
                  <Bell className="h-4 w-4" /> Notify Me
                </button>
                <Link to="/products/$slug" params={{ slug: p.slug }} className="inline-flex items-center rounded-full border border-border bg-background px-5 py-3 text-sm font-medium hover:bg-surface-muted">
                  Preview
                </Link>
              </div>
            </div>
          </motion.article>
        ))}
        {upcoming.length === 0 && (
          <p className="text-muted-foreground">No drops scheduled right now. Check back soon.</p>
        )}
      </div>
    </section>
  );
}
