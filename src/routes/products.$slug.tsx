import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, ArrowRight } from "lucide-react";
import { Countdown } from "@/components/store/Countdown";
import { ProductCard } from "@/components/store/ProductCard";
import { useProductBySlug, useProducts, useVariants } from "@/lib/queries";
import { formatPrice, productImage, statusLabel } from "@/lib/products";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/products/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Pixellato` },
      { name: "description", content: "Limited-edition product on Pixellato." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProductBySlug(slug);
  const { data: variants = [] } = useVariants(product?.id);
  const { data: allProducts = [] } = useProducts();
  const { add } = useCart();

  const [variant, setVariant] = useState<string>("");
  const [qty, setQty] = useState(1);

  if (isLoading) return <div className="mx-auto max-w-7xl px-6 py-24 text-muted-foreground">Loading…</div>;
  if (!product) return <div className="mx-auto max-w-7xl px-6 py-24">Product not found.</div>;

  const img = productImage(product.slug, product.image_url);
  const isLive = product.status === "live";
  const isUpcoming = product.status === "upcoming";

  const selectedVariant = variant || variants[0]?.name || "Default";

  const related = allProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pt-10 pb-20 md:pt-16">
        <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground">← Back to shop</Link>
        <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-16">
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-3xl bg-surface-muted">
              <img src={img} alt={product.title} width={1280} height={1280} className="h-full w-full object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-xl bg-surface-muted">
                  <img src={img} alt="" className="h-full w-full object-cover opacity-90" loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          <div className="md:pt-2">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{product.category}</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{product.title}</h1>
            <div className="mt-4 text-2xl font-medium tabular-nums">{formatPrice(Number(product.price))}</div>
            <div className="mt-2 text-sm text-muted-foreground">{statusLabel(product.status)}</div>

            <p className="mt-8 max-w-md leading-relaxed text-foreground/80">{product.description}</p>

            {isUpcoming && product.release_time && (
              <div className="mt-8 rounded-2xl border border-border bg-surface-muted/60 p-6">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Drops in</div>
                <div className="mt-3"><Countdown to={product.release_time} /></div>
              </div>
            )}

            {isLive && variants.length > 0 && (
              <div className="mt-10">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {variants[0].name === "One Size" ? "Size" : "Select size"}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const active = selectedVariant === v.name;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setVariant(v.name)}
                        disabled={v.stock === 0}
                        className={
                          "min-w-14 rounded-full border px-4 py-2 text-sm transition-colors " +
                          (active
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background hover:bg-surface-muted")
                        }
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isLive && (
              <div className="mt-8 flex items-center gap-4">
                <div className="inline-flex items-center rounded-full border border-border bg-background">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center"><Minus className="h-4 w-4" /></button>
                  <span className="w-10 text-center text-sm tabular-nums">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} className="grid h-10 w-10 place-items-center"><Plus className="h-4 w-4" /></button>
                </div>
                <button
                  onClick={() => {
                    add({
                      productId: product.id,
                      slug: product.slug,
                      title: product.title,
                      price: Number(product.price),
                      variant: selectedVariant,
                      quantity: qty,
                      imageUrl: product.image_url,
                    });
                    navigate({ to: "/cart" });
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.01]"
                >
                  Buy Now <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">You might also like</h2>
            <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
