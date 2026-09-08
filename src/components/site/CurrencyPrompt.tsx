import { useEffect, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * No confirmation popup: the currency is auto-applied from the visitor's
 * region on first load. This only shows a quiet, non-blocking toast so the
 * shopper knows prices were localised and can switch if the guess is wrong.
 */
export function CurrencyAutoNotice() {
  const { ready, autoDetected, currency } = useCurrency();
  const shown = useRef(false);

  useEffect(() => {
    if (!ready || !autoDetected || shown.current) return;
    if (currency.code === "INR") return;
    shown.current = true;
    try {
      if (window.sessionStorage.getItem("rosado-currency-notice")) return;
      window.sessionStorage.setItem("rosado-currency-notice", "1");
    } catch { /* ignore */ }
    toast(`Prices shown in ${currency.code} (${currency.country})`, {
      description: "Change your country any time from the footer.",
      duration: 6000,
    });
  }, [ready, autoDetected, currency]);

  return null;
}

/** Emoji flag from a 2-letter region code (EU falls back to the flag emoji). */
function flagOf(code: string) {
  const cc = (code || "").toUpperCase();
  if (cc === "EU") return "🇪🇺";
  if (cc.length !== 2) return "🌐";
  return String.fromCodePoint(...[...cc].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

/** Compact country + currency switcher used in the header top bar and footer. */
export function CurrencySelector({ className = "" }: { className?: string }) {
  const { currencies, currency, setCurrency } = useCurrency();
  if (currencies.length < 2) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Country and currency"
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-background/40 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em] outline-none transition-colors hover:border-primary/50 hover:text-primary focus-visible:ring-1 focus-visible:ring-primary",
          className,
        )}
      >
        <span className="text-[0.85rem] leading-none">{flagOf(currency.country_code)}</span>
        <span className="font-medium">{currency.code}</span>
        <span className="opacity-70">{currency.symbol}</span>
        <ChevronDown className="h-3 w-3 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 max-h-80 overflow-y-auto p-1">
        <p className="px-2 py-1.5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
          Ship to / currency
        </p>
        {currencies.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onSelect={() => setCurrency(c.code)}
            className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2 py-2 text-sm normal-case tracking-normal"
          >
            <span className="text-base leading-none">{flagOf(c.country_code)}</span>
            <span className="flex-1 truncate">{c.country}</span>
            <span className="text-xs text-muted-foreground">{c.code} {c.symbol}</span>
            {c.code === currency.code && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
