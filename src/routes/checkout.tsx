import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Pixellato" }] }),
  component: Checkout,
});

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-foreground"
      />
    </label>
  );
}

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "", full_name: "", shipping_address: "", city: "", postal_code: "", country: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Your bag is empty</h1>
        <Link to="/shop" className="mt-6 inline-flex rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">Browse shop</Link>
      </section>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        ...form,
        subtotal,
        total: subtotal,
        status: "pending",
      })
      .select()
      .single();

    if (error || !order) {
      setLoading(false);
      alert("Could not place order. Please try again.");
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        title: i.title,
        variant_name: i.variant,
        quantity: i.quantity,
        unit_price: i.price,
      })),
    );

    setLoading(false);
    if (itemsError) {
      alert("Could not save order items.");
      return;
    }
    clear();
    navigate({ to: "/order/$id", params: { id: order.id } });
  };

  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Checkout</h1>
      <form onSubmit={onSubmit} className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <div>
            <h2 className="text-lg font-medium">Contact</h2>
            <div className="mt-6 grid gap-5">
              <Field label="Email" type="email" required value={form.email} onChange={update("email")} />
              <Field label="Full name" required value={form.full_name} onChange={update("full_name")} />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-medium">Shipping</h2>
            <div className="mt-6 grid gap-5">
              <Field label="Address" required value={form.shipping_address} onChange={update("shipping_address")} />
              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="City" required value={form.city} onChange={update("city")} />
                <Field label="Postal code" required value={form.postal_code} onChange={update("postal_code")} />
                <Field label="Country" required value={form.country} onChange={update("country")} />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-medium">Payment</h2>
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-muted/40 p-6 text-sm text-muted-foreground">
              Payment is a placeholder in this preview. Your order will be recorded as "pending".
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl bg-surface-muted/60 p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-medium">Order</h2>
          <ul className="mt-4 divide-y divide-border">
            {items.map((i) => (
              <li key={i.productId + i.variant} className="flex justify-between py-3 text-sm">
                <span>{i.title} <span className="text-muted-foreground">· {i.variant} × {i.quantity}</span></span>
                <span className="tabular-nums">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="font-medium">Total</span>
            <span className="text-lg font-semibold tabular-nums">{formatPrice(subtotal)}</span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background disabled:opacity-60"
          >
            {loading ? "Placing order…" : "Place Order"}
          </button>
        </aside>
      </form>
    </section>
  );
}
