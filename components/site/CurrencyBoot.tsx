import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getPublicCurrencies } from "@/lib/site-settings.functions";
import { CurrencyProvider } from "@/lib/currency";

/** Loads the admin-managed currency list and provides it to the whole site. */
export function CurrencyBoot({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: ["currencies"],
    queryFn: () => getPublicCurrencies(),
    staleTime: 5 * 60 * 1000,
  });
  return <CurrencyProvider currencies={data}>{children}</CurrencyProvider>;
}
