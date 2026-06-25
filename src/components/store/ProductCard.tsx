import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Countdown } from "./Countdown";
import { formatPrice, productImage, statusLabel, type Product } from "@/lib/products";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const img = productImage(product.slug, product.image_url);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="group block"
      >
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-muted">
          <img
            src={img}
            alt={product.title}
            loading="lazy"
            width={1280}
            height={1280}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          <div className="absolute left-4 top-4">
            <span className="inline-flex items-center rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium tracking-wide text-foreground backdrop-blur">
              {statusLabel(product.status)}
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-medium text-foreground">{product.title}</h3>
            {product.category && (
              <div className="mt-1 text-xs text-muted-foreground">{product.category}</div>
            )}
            {product.status === "upcoming" && product.release_time && (
              <div className="mt-2"><Countdown to={product.release_time} compact /></div>
            )}
          </div>
          <div className="text-[15px] font-medium tabular-nums text-foreground">
            {formatPrice(Number(product.price))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
