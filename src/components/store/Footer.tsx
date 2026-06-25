import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-muted/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <div className="text-base font-semibold tracking-tight">Pixellato</div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Limited drops, made to last. Designed in small batches.
          </p>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Shop</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/shop" className="hover:underline">All Products</Link></li>
            <li><Link to="/drops" className="hover:underline">Next Drop</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Company</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/about" className="hover:underline">About</Link></li>
            <li><a href="#" className="hover:underline">Contact</a></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Help</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href="#" className="hover:underline">Shipping</a></li>
            <li><a href="#" className="hover:underline">Returns</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Pixellato</span>
          <span>Made with care.</span>
        </div>
      </div>
    </footer>
  );
}
