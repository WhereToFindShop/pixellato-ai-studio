import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { createPaypalOrder, capturePaypalOrder } from "@/lib/paypal";

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
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "", full_name: "", shipping_address: "", city: "", postal_code: "", country: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const formValid = Object.values(form).every((v) => v.trim().length > 0);
  const paidTotal = useRef(0);

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Your bag is empty</h1>
        <Link to="/shop" className="mt-6 inline-flex rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">Browse shop</Link>
      </section>
    );
  }

  // Record the paid order in Supabase after PayPal capture succeeds.
  const placeOrder = async (total: number) => {
    const { data: order, error } = await supabase
      .from("orders")
      .insert({ ...form, subtotal: total, total, status: "paid" })
      .select()
      .single();
    if (error || !order) throw new Error("Could not save order");

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
    if (itemsError) throw new Error("Could not save order items");

    clear();
    navigate({ to: "/order/$id", params: { id: order.id } });
  };

  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Checkout</h1>
      <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
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
            <p className="mt-6 text-sm text-muted-foreground">
              Pay securely with PayPal. Fill in your details above to enable payment.
            </p>
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
          {!formValid && (
            <p className="mt-6 text-xs text-muted-foreground">
              Complete contact & shipping details to pay.
            </p>
          )}
          <div className="mt-6" style={{ colorScheme: "light" }}>
            <PayPalScriptProvider
              options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID, currency: "USD" }}
            >
              <PayPalButtons
                style={{ layout: "vertical" }}
                disabled={!formValid}
                forceReRender={[subtotal, formValid]}
                createOrder={async () => {
                  setError(null);
                  const r = await createPaypalOrder({
                    data: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
                  });
                  paidTotal.current = r.total;
                  return r.id;
                }}
                onApprove={async (data) => {
                  try {
                    const cap = await capturePaypalOrder({ data: data.orderID });
                    if (cap.status !== "COMPLETED") throw new Error("Payment not completed");
                    await placeOrder(paidTotal.current);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Payment failed");
                  }
                }}
                onError={() => setError("PayPal error. Please try again.")}
              />
            </PayPalScriptProvider>
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </aside>
      </div>
    </section>
  );
}
