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

let productsRealtimeChannel: RealtimeChannel | null = null;
let productsRealtimeSubscribers = 0;

/** One shared channel — multiple useProducts() callers must not each subscribe(). */
function acquireProductsRealtime(onChange: () => void) {
  productsRealtimeSubscribers += 1;
  if (!productsRealtimeChannel) {
    productsRealtimeChannel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, onChange)
      .subscribe();
  }
  return () => {
    productsRealtimeSubscribers -= 1;
    if (productsRealtimeSubscribers <= 0 && productsRealtimeChannel) {
      supabase.removeChannel(productsRealtimeChannel);
      productsRealtimeChannel = null;
    }
  };
}

export function useProducts() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  useEffect(() => {
    return acquireProductsRealtime(() => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    });
  }, [queryClient]);

  return query;
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

/** When the next autonomous drop is expected: last run + interval. */
export function nextDropAt(config: ShopConfig | null | undefined): Date | null {
  if (!config?.last_run_at) return null;
  const base = new Date(config.last_run_at).getTime();
  const interval = (config.generation_interval_minutes || 5) * 60_000;
  return new Date(base + interval);
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
