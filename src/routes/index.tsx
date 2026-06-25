import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import { Countdown } from "@/components/store/Countdown";
import { useProducts } from "@/lib/queries";
import { formatPrice, productImage } from "@/lib/products";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pixellato — Limited Drops. Timeless Design." },
      { name: "description", content: "Discover exclusive merchandise released on a schedule. Once they're gone, they're gone." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: products = [] } = useProducts();
  const featured = products.filter((p) => p.featured && p.status === "live").slice(0, 4);
  const upcoming = products.filter((p) => p.status === "upcoming").slice(0, 3);
  const featuredHero = products.find((p) => p.featured) ?? products[0];

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
              Discover exclusive merchandise released on a schedule. Once they're gone, they're gone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/drops"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                Upcoming Drops
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
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Featured Drop</div>
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

      {/* FEATURED PRODUCTS */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Shop</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Featured Products</h2>
            </div>
            <Link to="/shop" className="text-sm font-medium underline-offset-4 hover:underline">View all</Link>
          </div>
          <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING */}
      {upcoming.length > 0 && (
        <section className="border-t border-border bg-surface-muted/40">
          <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Coming Soon</div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Upcoming Drops</h2>
              </div>
              <Link to="/drops" className="text-sm font-medium underline-offset-4 hover:underline">All drops</Link>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {upcoming.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="overflow-hidden rounded-2xl bg-background shadow-soft"
                >
                  <Link to="/products/$slug" params={{ slug: p.slug }} className="block group">
                    <div className="aspect-[4/5] overflow-hidden bg-surface-muted">
                      <img
                        src={productImage(p.slug, p.image_url)}
                        alt={p.title}
                        loading="lazy"
                        width={1280}
                        height={1600}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-6">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">Releases in</div>
                      <div className="mt-3">
                        {p.release_time && <Countdown to={p.release_time} />}
                      </div>
                      <div className="mt-6 flex items-end justify-between">
                        <div>
                          <h3 className="text-lg font-medium">{p.title}</h3>
                          <div className="mt-1 text-sm text-muted-foreground">{formatPrice(Number(p.price))}</div>
                        </div>
                        <span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium">Notify me</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
