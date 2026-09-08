import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Heart, User, ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart-store";

type Item = {
  key: string;
  label: string;
  Icon: typeof Home;
  to?: string;
  onClick?: () => void;
  isActive?: (pathname: string) => boolean;
};

function openChat() {
  window.dispatchEvent(new CustomEvent("floating-widget:open", { detail: { pane: "chat" } }));
}

export function MobileBottomNav() {
  const cartCount = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0));
  const openCart = useCart((s) => s.open);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items: Item[] = [
    { key: "home", label: "Home", Icon: Home, to: "/", isActive: (p) => p === "/" },
    { key: "chat", label: "Chat", Icon: MessageCircle, onClick: openChat },
    {
      key: "wishlist",
      label: "Wishlist",
      Icon: Heart,
      to: "/blog",
      isActive: (p) => p.startsWith("/blog"),
    },
    {
      key: "account",
      label: "Account",
      Icon: User,
      to: "/contact",
      isActive: (p) => p.startsWith("/contact"),
    },
    { key: "bag", label: "Bag", Icon: ShoppingBag, onClick: openCart },
  ];

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto max-w-xs px-3 pb-2">
        <div className="flex items-center justify-between rounded-full border border-header-top/50 bg-floating-bar-bg px-2 py-1.5 shadow-[0_8px_24px_-12px_rgba(60,40,30,0.18)] backdrop-blur-xl">
          {items.map(({ key, label, Icon, to, onClick, isActive }) => {
            const active = to && isActive ? isActive(pathname) : false;
            const showBadge = key === "bag" && cartCount > 0;
            const content = (
              <>
                <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
                {showBadge && (
                  <span className="absolute -right-0.5 -top-0.5 hidden h-3.5 min-w-3.5 place-items-center rounded-full bg-primary px-1 text-[9px] font-medium leading-none text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </>
            );
            const cls = `relative grid h-9 w-9 place-items-center rounded-full transition-colors ${
              active
                ? "bg-floating-bar-icon-active text-floating-bar-icon-active-text"
                : "text-foreground/75 hover:bg-floating-bar-icon-hover/40 hover:text-foreground"
            }`;
            return to ? (
              <Link key={key} to={to} aria-label={label} className={cls}>
                {content}
              </Link>
            ) : (
              <button key={key} type="button" aria-label={label} onClick={onClick} className={cls}>
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
