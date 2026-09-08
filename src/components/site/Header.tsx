import { Link } from "@tanstack/react-router";
import { Search, User, Heart, ShoppingBag, Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "./Logo";
import { MegaMenu } from "./MegaMenu";
import { useCart } from "@/lib/cart-store";
import { SearchDialog } from "./SearchDialog";
import { useAuth } from "@/lib/auth-hooks";
import { supabase } from "@/integrations/supabase/client";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { CurrencySelector } from "./CurrencyPrompt";

const defaultNav = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "My Shop", to: "/collections", mega: true },
  { label: "Our Blog", to: "/blog" },
  { label: "Contact Us", to: "/contact" },
];


export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const cartCount = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0));
  const openCart = useCart((s) => s.open);
  const settingsQ = useQuery({ queryKey: ["site-settings"], queryFn: () => getSiteSettings() });
  const navLinks = (settingsQ.data?.header_menu && settingsQ.data.header_menu.length > 0) ? settingsQ.data.header_menu : defaultNav;
  const megaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMega = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    setMega(true);
  };
  const closeMega = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    megaTimer.current = setTimeout(() => setMega(false), 180);
  };

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled ? "bg-header-main/95 backdrop-blur border-b border-border" : "bg-header-main"
      }`}
    >
      <div className="border-b border-border/20 bg-header-top text-foreground/90">
        <div className="container-site flex h-9 items-center justify-between text-[0.62rem] uppercase tracking-[0.22em]">
          <span className="hidden md:inline">Complimentary shipping across India · Certified gemstones</span>
          <span className="md:hidden">Free shipping in India</span>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">+91 93721 45040 · info.rosadogems@gmail.com</span>
            <CurrencySelector />
          </div>
        </div>
      </div>

      <div className="relative container-site grid h-20 grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-6">
        <Logo className="h-12 md:h-11" />

        <nav className="hidden justify-center lg:flex">
          <ul className="flex items-center gap-9">
            {navLinks.map((l) => (
              <li
                key={l.label}
                onMouseEnter={() => l.mega && openMega()}
                onMouseLeave={() => l.mega && closeMega()}
              >
                <Link
                  to={l.to}
                  className="group relative text-[0.78rem] uppercase tracking-[0.2em] text-foreground/85 transition-colors hover:text-primary"
                  activeProps={{ className: "text-primary" }}
                >
                  {l.label}
                  <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-primary transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mr-[-6px] flex items-center gap-2 md:gap-4 justify-self-end">
          <button aria-label="Search" onClick={() => setSearch(true)} className="p-1.5 text-foreground/80 transition-colors hover:text-primary"><Search className="h-[18px] w-[18px]" /></button>
          <div className="relative">
            <button aria-label="Account" onClick={() => user ? setUserMenu((v) => !v) : (window.location.href = "/auth")}
              className="hidden p-1.5 text-foreground/80 transition-colors hover:text-primary sm:inline-flex"><User className="h-[18px] w-[18px]" /></button>
            {userMenu && user && (
              <div className="absolute right-0 mt-2 w-56 rounded-sm border border-border bg-background shadow-lg py-2 text-sm z-50" onMouseLeave={() => setUserMenu(false)}>
                <p className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</p>
                <Link to="/account" onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-3 py-2 hover:bg-header-top"><User className="h-4 w-4" />My account</Link>
                {isAdmin && <Link to="/admin" onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-3 py-2 hover:bg-header-top"><LayoutDashboard className="h-4 w-4" />Admin panel</Link>}
                <button onClick={async () => { await supabase.auth.signOut(); setUserMenu(false); window.location.href = "/"; }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-header-top"><LogOut className="h-4 w-4" />Sign out</button>
              </div>
            )}
          </div>
          <Link to="/account" aria-label="Wishlist" className="hidden p-1.5 text-foreground/80 transition-colors hover:text-primary lg:inline-flex"><Heart className="h-[18px] w-[18px]" /></Link>
          <button aria-label="Cart" onClick={openCart} className="relative p-1.5 text-foreground/85 transition-colors hover:text-primary">
            <ShoppingBag className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 hidden h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground md:grid">{cartCount}</span>
            )}
          </button>
          <button aria-label="Menu" className="p-1.5 lg:hidden" onClick={() => setMobile(true)}><Menu className="h-5 w-5" /></button>
        </div>

        <MegaMenu open={mega} onClose={() => setMega(false)} onMouseEnter={openMega} onMouseLeave={closeMega} />
      </div>

      {/* Mobile drawer */}
      {mobile && (
        <div className="fixed inset-0 z-50 bg-header-main lg:hidden">
          <div className="container-site flex h-20 items-center justify-between">
            <Logo className="h-9" />
            <button aria-label="Close" onClick={() => setMobile(false)}><X className="h-6 w-6" /></button>
          </div>
          <nav className="container-site mt-6 flex flex-col gap-5">
            {navLinks.map((l) => (
              <Link key={l.label} to={l.to} onClick={() => setMobile(false)} className="font-display text-3xl">{l.label}</Link>
            ))}
          </nav>
        </div>
      )}
      <SearchDialog open={search} onClose={() => setSearch(false)} />
    </header>
  );
}
