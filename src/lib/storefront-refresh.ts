import type { QueryClient } from "@tanstack/react-query";

/**
 * Query keys the storefront reads. Invalidating these after an admin save makes
 * products, variants, categories and the homepage refetch immediately.
 */
export const STOREFRONT_QUERY_KEYS: string[] = [
  "product",
  "products",
  "variants",
  "category",
  "categories",
  "homepage",
  "search",
  "page",
  "site-settings",
];

const CHANNEL = "rosado:storefront-refresh";

type RouterLike = { invalidate: () => unknown } | null | undefined;

/** Invalidate storefront caches in THIS tab and re-run route loaders. */
export async function refreshStorefront(qc: QueryClient, router?: RouterLike) {
  for (const key of STOREFRONT_QUERY_KEYS) {
    qc.invalidateQueries({ queryKey: [key] });
  }
  // Admin lists too, so the grid reflects the new state.
  qc.invalidateQueries({ queryKey: ["admin"] });
  qc.invalidateQueries({ queryKey: ["admin-products"] });
  await Promise.resolve(router?.invalidate());
}

/** Tell every other open tab / preview frame to refetch storefront data. */
export function broadcastStorefrontRefresh() {
  if (typeof window === "undefined") return;
  const payload = String(Date.now());
  try {
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel(CHANNEL);
      bc.postMessage(payload);
      bc.close();
    }
  } catch {
    /* ignore */
  }
  try {
    window.localStorage.setItem(CHANNEL, payload);
  } catch {
    /* ignore */
  }
}

/** Invalidate locally and notify other tabs. Call after Save/Publish. */
export async function publishStorefrontRefresh(qc: QueryClient, router?: RouterLike) {
  await refreshStorefront(qc, router);
  broadcastStorefrontRefresh();
}

/** Subscribe to refresh signals from other tabs. Returns an unsubscribe fn. */
export function subscribeStorefrontRefresh(onRefresh: () => void) {
  if (typeof window === "undefined") return () => {};
  let bc: BroadcastChannel | null = null;
  try {
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel(CHANNEL);
      bc.onmessage = () => onRefresh();
    }
  } catch {
    bc = null;
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === CHANNEL) onRefresh();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("storage", onStorage);
    bc?.close();
  };
}
