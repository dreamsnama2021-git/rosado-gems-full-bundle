// GST / tax computation shared by checkout.
// India-only GST split: intra-state (same as store's home state) = CGST + SGST,
// inter-state = IGST. Other countries fall back to a single tax line.

export type TaxConfig = {
  enabled: boolean;
  label: string;
  rate: number; // percent
  inclusive: boolean;
  originState: string;
};

export type TaxLine = { label: string; rate: number; amount: number };

export type TaxResult = {
  applicable: boolean;
  inclusive: boolean;
  rate: number;
  amount: number; // total tax
  lines: TaxLine[];
  regime: "cgst_sgst" | "igst" | "generic" | "none";
};

const round2 = (n: number) => Math.round(n * 100) / 100;

const norm = (s: string | undefined | null) =>
  (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export function isIndia(country: string | undefined | null) {
  const c = norm(country);
  return c === "india" || c === "in" || c === "ind";
}

export function computeTax(
  cfg: TaxConfig,
  opts: { taxableBase: number; state?: string; country?: string },
): TaxResult {
  const none: TaxResult = {
    applicable: false,
    inclusive: cfg.inclusive,
    rate: 0,
    amount: 0,
    lines: [],
    regime: "none",
  };

  const rate = Number(cfg.rate) || 0;
  if (!cfg.enabled || rate <= 0 || opts.taxableBase <= 0) return none;

  const india = isIndia(opts.country);
  // GST only applies to Indian orders.
  if (!india) return none;

  const base = opts.taxableBase;
  const amount = cfg.inclusive
    ? round2(base - base / (1 + rate / 100))
    : round2((base * rate) / 100);

  const intraState = norm(opts.state) === norm(cfg.originState);
  const label = cfg.label || "GST";

  let lines: TaxLine[];
  let regime: TaxResult["regime"];
  if (intraState) {
    const half = round2(amount / 2);
    lines = [
      { label: `CGST (${rate / 2}%)`, rate: rate / 2, amount: half },
      { label: `SGST (${rate / 2}%)`, rate: rate / 2, amount: round2(amount - half) },
    ];
    regime = "cgst_sgst";
  } else {
    lines = [{ label: `IGST (${rate}%)`, rate, amount }];
    regime = "igst";
  }

  return { applicable: true, inclusive: cfg.inclusive, rate, amount, lines, regime: regime ?? "generic", };
}

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry",
];
