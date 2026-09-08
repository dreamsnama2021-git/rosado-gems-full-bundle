import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { detectRegionCandidates } from "@/lib/geo";

export type CurrencyRounding = "none" | "nearest_1" | "nearest_5" | "ending_99";

export type CurrencyRow = {
  country: string;
  country_code: string;
  code: string;
  symbol: string;
  rate: number; // multiplier from INR
  rounding: CurrencyRounding;
  enabled: boolean;
};

export const BASE_CURRENCY: CurrencyRow = {
  country: "India",
  country_code: "IN",
  code: "INR",
  symbol: "₹",
  rate: 1,
  rounding: "none",
  enabled: true,
};

// Rates are multipliers from INR. Defaults refreshed 2026-09-03; the admin
// Currencies panel overrides these once rates are managed in settings.
export const DEFAULT_CURRENCIES: CurrencyRow[] = [
  BASE_CURRENCY,
  { country: "United States", country_code: "US", code: "USD", symbol: "$", rate: 0.01058, rounding: "nearest_1", enabled: true },
  { country: "United Kingdom", country_code: "GB", code: "GBP", symbol: "£", rate: 0.00784, rounding: "nearest_1", enabled: true },
  { country: "European Union", country_code: "EU", code: "EUR", symbol: "€", rate: 0.00911, rounding: "nearest_1", enabled: true },
  { country: "United Arab Emirates", country_code: "AE", code: "AED", symbol: "د.إ", rate: 0.0387, rounding: "nearest_1", enabled: true },
  { country: "Australia", country_code: "AU", code: "AUD", symbol: "A$", rate: 0.01472, rounding: "nearest_1", enabled: true },
  { country: "Canada", country_code: "CA", code: "CAD", symbol: "C$", rate: 0.0146, rounding: "nearest_1", enabled: true },
  { country: "Singapore", country_code: "SG", code: "SGD", symbol: "S$", rate: 0.01342, rounding: "nearest_1", enabled: true },
];


export const STORAGE_KEY = "rosado-currency";
/** Tracks whether the stored currency was auto-detected or explicitly chosen. */
export const SOURCE_KEY = "rosado-currency-source";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeCurrencies(raw: any): CurrencyRow[] {
  const list: CurrencyRow[] = Array.isArray(raw) && raw.length > 0
    ? raw.map((r) => ({
        country: String(r?.country ?? ""),
        country_code: String(r?.country_code ?? "").toUpperCase(),
        code: String(r?.code ?? "INR").toUpperCase(),
        symbol: String(r?.symbol ?? "₹"),
        rate: Number(r?.rate) > 0 ? Number(r.rate) : 1,
        rounding: (["none", "nearest_1", "nearest_5", "ending_99"].includes(r?.rounding) ? r.rounding : "none") as CurrencyRounding,
        enabled: r?.enabled !== false,
      }))
    : DEFAULT_CURRENCIES;
  const enabled = list.filter((c) => c.enabled);
  if (!enabled.some((c) => c.code === "INR")) enabled.unshift(BASE_CURRENCY);
  return enabled;
}

export function applyRounding(value: number, rounding: CurrencyRounding) {
  switch (rounding) {
    case "nearest_1": return Math.round(value);
    case "nearest_5": return Math.round(value / 5) * 5;
    case "ending_99": return Math.max(0.99, Math.floor(value) + 0.99);
    default: return Math.round(value * 100) / 100;
  }
}

export function convertFromINR(amountInr: number, c: CurrencyRow) {
  if (c.code === "INR") return Math.round(amountInr * 100) / 100;
  return applyRounding(amountInr * c.rate, c.rounding);
}

export function formatMoney(amount: number, c: CurrencyRow) {
  const locale = c.code === "INR" ? "en-IN" : "en-US";
  const decimals = Number.isInteger(amount) ? 0 : 2;
  return c.symbol + amount.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: 2 });
}

type Ctx = {
  currencies: CurrencyRow[];
  currency: CurrencyRow;
  setCurrency: (code: string) => void;
  convert: (inr: number) => number;
  format: (inr: number) => string;
  /** true once the visitor's saved/detected choice has been applied on the client */
  ready: boolean;
  /** true when the active currency came from region detection, not an explicit pick */
  autoDetected: boolean;
  /** region code the detection resolved to, when known */
  detectedRegion: string | null;
};

const CurrencyContext = createContext<Ctx | null>(null);

/**
 * Picks the best currency row for the visitor's region candidates.
 * India keeps INR; every other region falls back to USD when no exact
 * country match is configured.
 */
function matchCurrency(currencies: CurrencyRow[], regions: string[]): CurrencyRow | null {
  for (const region of regions) {
    const hit = currencies.find((c) => c.country_code === region);
    if (hit) return hit;
  }
  const isIndia = regions.includes("IN");
  if (!isIndia && regions.length > 0) {
    return currencies.find((c) => c.code === "USD") ?? null;
  }
  return null;
}


export function CurrencyProvider({ currencies: input, children }: { currencies?: unknown; children: React.ReactNode }) {
  const currencies = useMemo(() => normalizeCurrencies(input), [input]);
  const [code, setCode] = useState<string>("INR");
  const [ready, setReady] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const [detectedRegion, setDetectedRegion] = useState<string | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    let source: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
      source = window.localStorage.getItem(SOURCE_KEY);
    } catch { /* ignore */ }

    // An explicit pick always wins and is never overridden by detection.
    if (saved && source === "manual" && currencies.some((c) => c.code === saved)) {
      setCode(saved);
      setReady(true);
      return;
    }

    // First visit (or a previous auto choice): detect silently, no popup.
    const regions = detectRegionCandidates();
    const guess = matchCurrency(currencies, regions);
    setDetectedRegion(regions[0] ?? null);

    if (guess) {
      setCode(guess.code);
      setAutoDetected(true);
      try {
        window.localStorage.setItem(STORAGE_KEY, guess.code);
        window.localStorage.setItem(SOURCE_KEY, "auto");
      } catch { /* ignore */ }
    } else if (saved && currencies.some((c) => c.code === saved)) {
      setCode(saved);
      setAutoDetected(true);
    }
    setReady(true);
  }, [currencies]);

  const currency = useMemo(
    () => currencies.find((c) => c.code === code) ?? currencies[0] ?? BASE_CURRENCY,
    [currencies, code],
  );

  const setCurrency = useCallback((next: string) => {
    setCode(next);
    setAutoDetected(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.localStorage.setItem(SOURCE_KEY, "manual");
    } catch { /* ignore */ }
  }, []);

  const value = useMemo<Ctx>(() => ({
    currencies,
    currency,
    setCurrency,
    convert: (inr: number) => convertFromINR(Number(inr) || 0, currency),
    format: (inr: number) => formatMoney(convertFromINR(Number(inr) || 0, currency), currency),
    ready,
    autoDetected,
    detectedRegion,
  }), [currencies, currency, setCurrency, ready, autoDetected, detectedRegion]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}


const FALLBACK: Ctx = {
  currencies: [BASE_CURRENCY],
  currency: BASE_CURRENCY,
  setCurrency: () => {},
  convert: (inr: number) => Number(inr) || 0,
  format: (inr: number) => formatMoney(Number(inr) || 0, BASE_CURRENCY),
  ready: false,
  autoDetected: false,
  detectedRegion: null,
};

export function useCurrency() {
  return useContext(CurrencyContext) ?? FALLBACK;
}

/** Shorthand: const money = useMoney(); money(1200) -> "$14" */
export function useMoney() {
  return useCurrency().format;
}

/* ------------------------------------------------------------------ */
/* Per-product price overrides for non-INR countries                    */
/* ------------------------------------------------------------------ */

/** Map of currency code -> price expressed in that currency. */
export type PriceOverrides = Record<string, number>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeOverrides(raw: any): PriceOverrides {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: PriceOverrides = {};
  for (const [k, v] of Object.entries(raw)) {
    const code = String(k).toUpperCase();
    const n = Number(v);
    if (code && code !== "INR" && Number.isFinite(n) && n > 0) out[code] = n;
  }
  return out;
}

/** The override amount for a currency, or null when none is set. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function overrideFor(raw: any, code: string): number | null {
  const o = normalizeOverrides(raw);
  const v = o[String(code).toUpperCase()];
  return Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * INR-equivalent of a product price for the active currency. When an override
 * exists it is converted back to INR so cart, tax and shipping keep working on
 * a single base currency, while the shopper still sees the exact price set.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function effectiveInrPrice(inr: number, overrides: any, c: CurrencyRow): number {
  const o = overrideFor(overrides, c.code);
  if (o == null) return Number(inr) || 0;
  const rate = c.rate > 0 ? c.rate : 1;
  return Math.round((o / rate) * 100) / 100;
}

/** Formats a product price, preferring an override for the active currency. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatProductPrice(inr: number, overrides: any, c: CurrencyRow): string {
  const o = overrideFor(overrides, c.code);
  return formatMoney(o != null ? o : convertFromINR(Number(inr) || 0, c), c);
}

/**
 * Product-aware money helpers.
 *   const price = useProductPrice();
 *   price.format(p.price, p.price_overrides)  // "$149"
 *   price.inr(p.price, p.price_overrides)     // INR value to put in the cart
 */
export function useProductPrice() {
  const { currency } = useCurrency();
  return useMemo(
    () => ({
      currency,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      format: (inr: number, overrides?: any) => formatProductPrice(inr, overrides, currency),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inr: (inr: number, overrides?: any) => effectiveInrPrice(inr, overrides, currency),
    }),
    [currency],
  );
}
