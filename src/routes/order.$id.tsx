import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/order/$id")({
  head: () => ({ meta: [{ title: "Order confirmed — Pixellato" }] }),
  component: OrderConfirmation,
});

function OrderConfirmation() {
  const { id } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const [{ data: order }, { data: items }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", id).maybeSingle(),
        supabase.from("order_items").select("*").eq("order_id", id),
      ]);
      return { order, items: items ?? [] };
    },
  });

  const order = data?.order;
  const items = data?.items ?? [];

  return (
    <section className="mx-auto max-w-3xl px-6 pt-20 pb-24 md:pt-28">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-foreground text-background">
        <Check className="h-6 w-6" />
      </div>
      <h1 className="mt-8 text-4xl font-semibold tracking-tight md:text-5xl">Thank you.</h1>
      <p className="mt-4 text-muted-foreground">
        Your order has been received. We've sent confirmation details to your email.
      </p>

      {order && (
        <div className="mt-10 rounded-2xl bg-surface-muted/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div><span className="text-muted-foreground">Order</span> <span className="font-mono">{order.id.slice(0, 8)}</span></div>
            <div className="text-muted-foreground">{new Date(order.created_at).toLocaleString()}</div>
          </div>
          <ul className="mt-6 divide-y divide-border">
            {items.map((i: any) => (
              <li key={i.id} className="flex justify-between py-3 text-sm">
                <span>{i.title} <span className="text-muted-foreground">· {i.variant_name} × {i.quantity}</span></span>
                <span className="tabular-nums">{formatPrice(Number(i.unit_price) * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="font-medium">Total</span>
            <span className="text-lg font-semibold tabular-nums">{formatPrice(Number(order.total))}</span>
          </div>
        </div>
      )}

      <Link to="/shop" className="mt-10 inline-flex rounded-full border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-surface-muted">
        Continue shopping
      </Link>
    </section>
  );
}
