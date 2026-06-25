import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

async function accessToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Missing PayPal credentials");
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  return (await res.json()).access_token as string;
}

type LineItem = { productId: string; quantity: number };

// Total is recomputed from DB prices — never trust the amount sent by the client.
export const createPaypalOrder = createServerFn({ method: "POST" })
  .inputValidator((items: LineItem[]) => items)
  .handler(async ({ data: items }) => {
    if (!items.length) throw new Error("Empty cart");
    const ids = items.map((i) => i.productId);
    const { data: products, error } = await supabase
      .from("products")
      .select("id, price")
      .in("id", ids);
    if (error || !products) throw new Error("Could not load product prices");

    const priceById = new Map(products.map((p) => [p.id, Number(p.price)]));
    let total = 0;
    for (const it of items) {
      const price = priceById.get(it.productId);
      if (price == null) throw new Error(`Unknown product ${it.productId}`);
      if (it.quantity < 1) throw new Error("Invalid quantity");
      total += price * it.quantity;
    }

    const token = await accessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "USD", value: total.toFixed(2) } }],
      }),
    });
    const order = await res.json();
    if (!res.ok) throw new Error(order?.message ?? "Create order failed");
    return { id: order.id as string, total };
  });

export const capturePaypalOrder = createServerFn({ method: "POST" })
  .inputValidator((orderID: string) => orderID)
  .handler(async ({ data: orderID }) => {
    const token = await accessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? "Capture failed");
    return { status: data.status as string };
  });
