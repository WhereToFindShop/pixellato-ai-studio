import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, X, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice, productImage } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Bag — Pixellato" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, updateQty, remove, subtotal } = useCart();

  return (
    <section className="mx-auto max-w-7xl px-6 pt-16 pb-24 md:pt-24">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Your Bag</h1>

      {items.length === 0 ? (
        <div className="mt-12 rounded-3xl bg-surface-muted/60 p-12 text-center">
          <p className="text-muted-foreground">Your bag is empty.</p>
          <Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">
            Start shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <ul className="divide-y divide-border">
            {items.map((i) => (
              <li key={i.productId + i.variant} className="flex gap-6 py-6">
                <div className="aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-surface-muted sm:w-32">
                  <img src={productImage(i.slug, i.imageUrl)} alt={i.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{i.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{i.variant}</div>
                    </div>
                    <div className="text-sm font-medium tabular-nums">{formatPrice(i.price * i.quantity)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-border">
                      <button onClick={() => updateQty(i.productId, i.variant, i.quantity - 1)} className="grid h-9 w-9 place-items-center"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-8 text-center text-sm tabular-nums">{i.quantity}</span>
                      <button onClick={() => updateQty(i.productId, i.variant, i.quantity + 1)} className="grid h-9 w-9 place-items-center"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <button onClick={() => remove(i.productId, i.variant)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                      <X className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl bg-surface-muted/60 p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-medium">Summary</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="text-muted-foreground">Calculated next</dd></div>
            </dl>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
              <span className="font-medium">Total</span>
              <span className="text-lg font-semibold tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <Link to="/checkout" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">
              Checkout <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
