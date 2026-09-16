import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { SmoothScroll } from "./SmoothScroll";
import { MobileBottomNav } from "./MobileBottomNav";
import { FloatingWidgets } from "./FloatingWidgets";
import { Toaster } from "sonner";
import { CurrencyAutoNotice } from "./CurrencyPrompt";
import { MaintenanceGate } from "./MaintenanceGate";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <MaintenanceGate>
      <SmoothScroll />
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <MobileBottomNav />
      <CartDrawer />
      <FloatingWidgets />
      <CurrencyAutoNotice />
      <Toaster position="bottom-right" theme="light" />
    </MaintenanceGate>
  );
}

