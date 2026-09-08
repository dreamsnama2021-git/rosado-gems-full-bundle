// Permission-free country guess from the browser's IANA timezone and locale.
// No geolocation permission prompt, no network call — resolves synchronously.

const TZ_COUNTRY: Record<string, string> = {
  // India
  "Asia/Kolkata": "IN", "Asia/Calcutta": "IN",
  // United States
  "America/New_York": "US", "America/Detroit": "US", "America/Chicago": "US",
  "America/Denver": "US", "America/Boise": "US", "America/Los_Angeles": "US",
  "America/Phoenix": "US", "America/Anchorage": "US", "Pacific/Honolulu": "US",
  "America/Indiana/Indianapolis": "US", "America/Kentucky/Louisville": "US",
  // United Kingdom
  "Europe/London": "GB", "Europe/Belfast": "GB",
  // Eurozone
  "Europe/Dublin": "EU", "Europe/Paris": "EU", "Europe/Berlin": "EU", "Europe/Madrid": "EU",
  "Europe/Rome": "EU", "Europe/Amsterdam": "EU", "Europe/Brussels": "EU", "Europe/Lisbon": "EU",
  "Europe/Vienna": "EU", "Europe/Helsinki": "EU", "Europe/Athens": "EU", "Europe/Luxembourg": "EU",
  "Europe/Bratislava": "EU", "Europe/Ljubljana": "EU", "Europe/Tallinn": "EU", "Europe/Riga": "EU",
  "Europe/Vilnius": "EU", "Europe/Zagreb": "EU", "Europe/Malta": "EU", "Europe/Nicosia": "EU",
  "Asia/Nicosia": "EU", "Atlantic/Canary": "EU", "Europe/Monaco": "EU",
  // Gulf
  "Asia/Dubai": "AE", "Asia/Muscat": "AE",
  // Australia
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Brisbane": "AU",
  "Australia/Perth": "AU", "Australia/Adelaide": "AU", "Australia/Hobart": "AU",
  "Australia/Darwin": "AU", "Australia/Canberra": "AU",
  // Canada
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Edmonton": "CA",
  "America/Winnipeg": "CA", "America/Halifax": "CA", "America/St_Johns": "CA",
  "America/Regina": "CA", "America/Montreal": "CA",
  // Singapore
  "Asia/Singapore": "SG",
};

/** Coarse fallback when the exact zone is unknown but the prefix is telling. */
const TZ_PREFIX_COUNTRY: Array<[string, string]> = [
  ["Australia/", "AU"],
  ["Asia/Kolkata", "IN"],
];

const EU_REGIONS = new Set([
  "AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "IE", "IT", "LT", "LU",
  "LV", "MT", "NL", "PT", "SI", "SK", "HR", "MC", "AD", "SM",
]);

function fromTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return null;
    if (TZ_COUNTRY[tz]) return TZ_COUNTRY[tz];
    for (const [prefix, cc] of TZ_PREFIX_COUNTRY) {
      if (tz.startsWith(prefix)) return cc;
    }
  } catch { /* ignore */ }
  return null;
}

function fromLocales(): string[] {
  const out: string[] = [];
  try {
    const langs = [navigator.language, ...(navigator.languages ?? [])].filter(Boolean) as string[];
    for (const l of langs) {
      // Handles "en-GB", "en-Latn-GB" and "en-GB-u-ca-gregory".
      const parts = l.split("-");
      const region = parts.find((p) => /^[A-Za-z]{2}$/.test(p) && p !== parts[0])?.toUpperCase();
      if (!region) continue;
      if (EU_REGIONS.has(region)) out.push("EU");
      out.push(region);
    }
  } catch { /* ignore */ }
  return out;
}

/**
 * Ordered list of likely region codes, best guess first.
 * Timezone is trusted above locale because a device language rarely moves.
 */
export function detectRegionCandidates(): string[] {
  if (typeof window === "undefined") return [];
  const tz = fromTimezone();
  const list = [...(tz ? [tz] : []), ...fromLocales()];
  return Array.from(new Set(list.filter(Boolean)));
}

/** Returns an ISO country code (or "EU" for the eurozone), or null when unknown. */
export function detectCountryCode(): string | null {
  return detectRegionCandidates()[0] ?? null;
}
