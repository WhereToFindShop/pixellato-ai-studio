import tee from "@/assets/p-tee.jpg";
import hoodie from "@/assets/p-hoodie.jpg";
import mug from "@/assets/p-mug.jpg";
import cap from "@/assets/p-cap.jpg";
import overshirt from "@/assets/p-overshirt.jpg";
import tote from "@/assets/p-tote.jpg";

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

const slugImages: Record<string, string> = {
  "essential-tee-grey": tee,
  "archive-hoodie": hoodie,
  "porcelain-mug": mug,
  "field-cap-cream": cap,
  "linen-overshirt-sand": overshirt,
  "canvas-tote-black": tote,
};

export function productImage(slug: string, fallback?: string | null) {
  return slugImages[slug] ?? fallback ?? tee;
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
