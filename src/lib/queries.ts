import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductVariant } from "@/lib/products";
import { useEffect } from "react";

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Product[];
}

const PRODUCTS_RT_KEY = "__pixellatoProductsRealtime";

function getProductsRealtimeChannel(): RealtimeChannel | undefined {
  return (globalThis as typeof globalThis & { [PRODUCTS_RT_KEY]?: RealtimeChannel })[PRODUCTS_RT_KEY];
}

function setProductsRealtimeChannel(channel: RealtimeChannel | undefined) {
  (globalThis as typeof globalThis & { [PRODUCTS_RT_KEY]?: RealtimeChannel })[PRODUCTS_RT_KEY] = channel;
}

/** Mount once at app root — avoids duplicate Supabase channels when queries.ts is code-split. */
export function ProductsRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (getProductsRealtimeChannel()) return;

    const channel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["shop_config"] });
      })
      .subscribe();
    setProductsRealtimeChannel(channel);

    return () => {
      supabase.removeChannel(channel);
      setProductsRealtimeChannel(undefined);
    };
  }, [queryClient]);

  return null;
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
}

export type ShopConfig = {
  shop_name: string | null;
  generation_interval_minutes: number;
  last_run_at: string | null;
};

export function useShopConfig() {
  return useQuery({
    queryKey: ["shop_config"],
    refetchInterval: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_config")
        .select("shop_name, generation_interval_minutes, last_run_at")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ShopConfig | null;
    },
  });
}

/** When the next autonomous drop is expected. Rolls forward if the last window already passed. */
export function nextDropAt(config: ShopConfig | null | undefined): Date | null {
  if (!config?.last_run_at) return null;
  const intervalMs = (config.generation_interval_minutes || 5) * 60_000;
  const lastRun = new Date(config.last_run_at).getTime();
  let next = lastRun + intervalMs;
  const now = Date.now();
  if (next <= now) {
    const missed = Math.floor((now - next) / intervalMs) + 1;
    next += missed * intervalMs;
  }
  return new Date(next);
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });
}

export function useVariants(productId: string | undefined) {
  return useQuery({
    queryKey: ["variants", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProductVariant[];
    },
  });
}
