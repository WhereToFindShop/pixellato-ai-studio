import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export function Nav() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-base font-semibold tracking-tight">
          Pixellato
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-foreground/80 md:flex">
          <Link to="/shop" className="hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>Shop</Link>
          <Link to="/drops" className="hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>Drops</Link>
          <Link to="/about" className="hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>About</Link>
        </nav>
        <Link to="/cart" className="relative inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted transition-colors">
          <ShoppingBag className="h-4 w-4" />
          <span>Bag</span>
          {count > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-medium text-background">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
