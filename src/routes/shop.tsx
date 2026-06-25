import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/store/ProductCard";
import { useProducts } from "@/lib/queries";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Pixellato" },
      { name: "description", content: "Browse all available Pixellato products. Limited drops, made to last." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { data: products = [], isLoading } = useProducts();
  return (
    <section className="mx-auto max-w-7xl px-6 pt-16 pb-24 md:pt-24">
      <div className="max-w-3xl">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">All Products</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Shop</h1>
        <p className="mt-4 text-muted-foreground">Quietly built objects, released in small numbers.</p>
      </div>
      <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
        {!isLoading && products.length === 0 && (
          <p className="col-span-full text-muted-foreground">No products yet.</p>
        )}
      </div>
    </section>
  );
}
