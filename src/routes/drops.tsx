import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Bell, Radar, Sparkles, Trash2 } from "lucide-react";
import { Countdown } from "@/components/store/Countdown";
import { useProducts, useShopConfig, nextDropAt } from "@/lib/queries";
import { formatPrice, productImage } from "@/lib/products";

export const Route = createFileRoute("/drops")({
  head: () => ({
    meta: [
      { title: "The Next Drop — Pixellato" },
      { name: "description", content: "A brand-new AI-generated drop lands on a schedule. When it does, the current one is gone for good." },
    ],
  }),
  component: Drops,
});

const STEPS = [
  { icon: Radar, title: "Trend Scout", body: "Agents scan Hacker News, Lobste.rs and tech news for whatever the internet is obsessed with." },
  { icon: Sparkles, title: "Forge", body: "The winning trend is branded onto a tee, a tote, a mug and a cap — pixel art and all." },
  { icon: Trash2, title: "Overwrite", body: "The moment it goes live, the previous drop is wiped — products and artwork, gone for good." },
];

function Drops() {
  const { data: products = [] } = useProducts();
  const { data: config } = useShopConfig();
  const next = nextDropAt(config);
  const current = products.filter((p) => p.status === "live");

  return (
    <section className="mx-auto max-w-7xl px-6 pt-16 pb-24 md:pt-24">
      {/* HYPE HERO */}
      <div className="overflow-hidden rounded-3xl border border-border bg-surface-muted/60">
        <div className="grid items-center gap-10 p-8 md:grid-cols-2 md:p-16">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Incoming
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
              The next drop is
              <br />
              <span className="text-muted-foreground">almost here.</span>
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              Pixellato releases one drop at a time, generated end-to-end by autonomous agents. Blink and you'll miss it — when the next one lands, the current drop is erased forever.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">
                Shop the live drop <ArrowRight className="h-4 w-4" />
              </Link>
              <button className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-surface-muted">
                <Bell className="h-4 w-4" /> Notify Me
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border bg-background p-10 text-center"
          >
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Dropping in</div>
            <div className="mt-6 flex justify-center">
              {next ? <Countdown to={next} /> : <span className="text-sm text-muted-foreground">Calibrating…</span>}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              New drop every {config?.generation_interval_minutes ?? 5} minutes · fully autonomous
            </p>
          </motion.div>
        </div>
      </div>

      {/* HOW A DROP IS BORN */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">How each drop is born</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-background p-7"
            >
              <s.icon className="h-6 w-6 text-foreground" />
              <h3 className="mt-4 text-lg font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* LIVE NOW (gone when the timer hits zero) */}
      <div className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live now</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">Grab it before it's gone</h2>
          </div>
          <Link to="/shop" className="text-sm font-medium underline-offset-4 hover:underline">Shop all</Link>
        </div>

        {current.length > 0 ? (
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {current.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <Link to="/products/$slug" params={{ slug: p.slug }} className="group block">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-surface-muted">
                    <img
                      src={productImage(p.slug, p.image_url)}
                      alt={p.title}
                      loading="lazy"
                      width={800}
                      height={800}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <h3 className="text-sm font-medium">{p.title}</h3>
                      {p.category && <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{p.category}</div>}
                    </div>
                    <div className="text-sm tabular-nums text-muted-foreground">{formatPrice(Number(p.price))}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="mt-10 text-muted-foreground">The next drop is being forged right now. Check back in a moment.</p>
        )}
      </div>
    </section>
  );
}
