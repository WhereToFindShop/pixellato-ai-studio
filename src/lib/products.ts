import hero from "@/assets/hero.jpg";

export type ProductStatus = "live" | "upcoming" | "sold_out";

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  status: ProductStatus;
  release_time: string | null;
  featured: boolean;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  name: string;
  stock: number;
};

/** Prefer the live Supabase image URL; fall back to the static hero photo. */
export function productImage(_slug: string, imageUrl?: string | null) {
  return imageUrl ?? hero;
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function statusLabel(s: ProductStatus) {
  if (s === "live") return "Available";
  if (s === "upcoming") return "Upcoming";
  return "Sold Out";
}
