// Currency-aware order pricing.
//
// Every money rule (shipping flat rate, free-shipping threshold, COD fee and
// limits, tax) is stored in INR. This module converts each rule into the
// shopper's currency *first* — applying that currency's rounding — and then
// evaluates the rules and sums the rounded components, so the figures the
// shopper sees always add up exactly.

import { applyRounding, convertFromINR, BASE_CURRENCY, type CurrencyRow } from "./currency";
import { computeTax, isIndia, type TaxConfig, type TaxResult } from "./tax";

export type PricingRules = {
  shippingEnabled: boolean;
  shippingFlatRate: number; // INR
  freeShippingThreshold: number; // INR (0 = never free)
  codEnabled: boolean;
  codFee: number; // INR
  codMinOrder: number; // INR
  codMaxOrder: number; // INR (0 = no cap)
  tax: TaxConfig;
};

export type Quote = {
  currency: CurrencyRow;
  subtotal: number;
  shipping: number;
  shippingFree: boolean;
  codFee: number;
  codEligible: boolean;
  tax: TaxResult; // amounts already in `currency`
  taxToAdd: number;
  total: number;
  /** INR figures, used for server-side re-pricing and order storage */
  base: { subtotal: number; shipping: number; codFee: number; tax: number; total: number };
};

const norm = (s: string | undefined | null) => (s ?? "").trim().toLowerCase();

/** Find the currency configured for a shipping country (by name or ISO code). */
export function currencyForCountry(
  currencies: CurrencyRow[],
  country: string | undefined | null,
): CurrencyRow | null {
  const c = norm(country);
  if (!c) return null;
  if (isIndia(c)) return currencies.find((x) => x.code === "INR") ?? null;
  return (
    currencies.find((x) => norm(x.country) === c) ??
    currencies.find((x) => norm(x.country_code) === c) ??
    null
  );
}

/** COD is a domestic-India payment method only. */
export function codAvailableForCountry(country: string | undefined | null) {
  return isIndia(country);
}

export function quoteOrder(opts: {
  subtotalInr: number;
  rules: PricingRules;
  currency: CurrencyRow;
  country?: string;
  state?: string;
  paymentMethod: "cod" | "prepaid";
}): Quote {
  const currency = opts.currency ?? BASE_CURRENCY;
  const fx = (inr: number) => convertFromINR(Number(inr) || 0, currency);
  const round = (n: number) => applyRounding(n, currency.rounding === "ending_99" ? "none" : currency.rounding);

  const subtotal = fx(opts.subtotalInr);
  const r = opts.rules;

  // Shipping — threshold compared in the shopper's own currency.
  const threshold = r.freeShippingThreshold > 0 ? fx(r.freeShippingThreshold) : 0;
  const shippingFree = !r.shippingEnabled || (threshold > 0 && subtotal >= threshold);
  const shipping = shippingFree ? 0 : fx(r.shippingFlatRate);

  // COD — domestic only, limits compared in the shopper's currency.
  const codMin = r.codMinOrder > 0 ? fx(r.codMinOrder) : 0;
  const codMax = r.codMaxOrder > 0 ? fx(r.codMaxOrder) : 0;
  const codEligible =
    r.codEnabled &&
    codAvailableForCountry(opts.country) &&
    subtotal >= codMin &&
    (codMax === 0 || subtotal <= codMax);
  const usesCod = opts.paymentMethod === "cod" && codEligible;
  const codFee = usesCod ? fx(r.codFee) : 0;

  // Tax — computed on the converted (rounded) taxable base so the displayed
  // tax line matches the displayed subtotal, then each line is rounded.
  const rawTax = computeTax(r.tax, { taxableBase: subtotal, state: opts.state, country: opts.country });
  const tax: TaxResult = rawTax.applicable
    ? {
        ...rawTax,
        amount: round(rawTax.amount),
        lines: rawTax.lines.map((l) => ({ ...l, amount: round(l.amount) })),
      }
    : rawTax;
  const taxToAdd = tax.applicable && !tax.inclusive ? tax.amount : 0;

  const total = round(subtotal + shipping + codFee + taxToAdd);

  // INR equivalents (unrounded base currency) for storage / server re-pricing.
  const rate = currency.rate > 0 ? currency.rate : 1;
  const toBase = (n: number) => Math.round((n / rate) * 100) / 100;
  const base = {
    subtotal: Math.round((Number(opts.subtotalInr) || 0) * 100) / 100,
    shipping: currency.code === "INR" ? shipping : toBase(shipping),
    codFee: currency.code === "INR" ? codFee : toBase(codFee),
    tax: currency.code === "INR" ? taxToAdd : toBase(taxToAdd),
    total: 0,
  };
  base.total = Math.round((base.subtotal + base.shipping + base.codFee + base.tax) * 100) / 100;

  return { currency, subtotal, shipping, shippingFree, codFee, codEligible, tax, taxToAdd, total, base };
}
