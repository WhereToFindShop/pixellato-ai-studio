import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import { Countdown } from "@/components/store/Countdown";
import { useProducts, useShopConfig, nextDropAt } from "@/lib/queries";
import { formatPrice, productImage } from "@/lib/products";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pixellato — Limited Drops. Timeless Design." },
      { name: "description", content: "One AI-generated drop at a time. When the next trend hits, this one is gone forever." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: products = [] } = useProducts();
  const { data: config } = useShopConfig();

  // The current drop = everything live right now (the pipeline keeps only one drop live).
  const drop = products.filter((p) => p.status === "live");
  const featuredHero = drop.find((p) => p.featured) ?? drop[0];
  const next = nextDropAt(config);

  return (
    <>
      {/* HERO */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-6 md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[88px] lg:leading-[0.98]">
              Limited Drops.
              <br />
              <span className="text-muted-foreground">Timeless Design.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              One AI-generated drop at a time, born from whatever the internet is obsessed with right now. When the next trend hits, this one is gone forever.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
              >
                Shop This Drop <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/drops"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                Next Drop
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Hero featured image */}
        <div className="mx-auto max-w-7xl px-6 pb-16 md:pb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-10 overflow-hidden rounded-3xl bg-surface-muted"
          >
            <div className="grid items-center gap-8 p-8 md:grid-cols-2 md:p-16">
              <div>
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Live Drop
                </div>
                {featuredHero && (
                  <>
                    <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">{featuredHero.title}</h2>
                    <p className="mt-4 max-w-md text-muted-foreground">{featuredHero.description}</p>
                    <div className="mt-6 text-2xl font-medium tabular-nums">{formatPrice(Number(featuredHero.price))}</div>
                    <Link
                      to="/products/$slug"
                      params={{ slug: featuredHero.slug }}
                      className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
                    >
                      View Product <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-background"
              >
                <img
                  src={featuredHero ? productImage(featuredHero.slug, featuredHero.image_url) : heroImg}
                  alt={featuredHero?.title ?? "Pixellato"}
                  width={1280}
                  height={1024}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* THIS DROP */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Available Now</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">This Drop</h2>
              <p className="mt-2 text-sm text-muted-foreground">One trend, four pieces — a tee, a mug, a bottle and a cap.</p>
            </div>
            <Link to="/shop" className="text-sm font-medium underline-offset-4 hover:underline">View all</Link>
          </div>
          <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {drop.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
          {drop.length === 0 && (
            <p className="mt-12 text-muted-foreground">The next drop is being forged right now. Check back in a moment.</p>
          )}
        </div>
      </section>

      {/* NEXT DROP HYPE */}
      <section className="border-t border-border bg-surface-muted/40">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="overflow-hidden rounded-3xl border border-border bg-background p-8 md:p-14">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" /> Coming Soon
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">The next drop is loading.</h2>
                <p className="mt-4 max-w-md text-muted-foreground">
                  Our agents are watching the trends in real time. When the timer hits zero, this drop disappears and a brand-new one takes its place.
                </p>
                <Link
                  to="/drops"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
                >
                  See what's coming <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-2xl border border-border bg-surface-muted/60 p-8 text-center">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Next drop in</div>
                <div className="mt-4 flex justify-center">
                  {next ? <Countdown to={next} /> : <span className="text-sm text-muted-foreground">Calibrating…</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
