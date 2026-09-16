import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { mergeMegaMenu } from "@/lib/mega-menu-config";

export function MegaMenu({ open, onClose, onMouseEnter, onMouseLeave }: { open: boolean; onClose: () => void; onMouseEnter?: () => void; onMouseLeave?: () => void }) {
  const settingsQ = useQuery({ queryKey: ["site-settings"], queryFn: () => getSiteSettings() });
  const cfg = mergeMegaMenu(settingsQ.data?.mega_menu);
  const columns = cfg.columns;
  const promos = cfg.promos;

  const [promoIdx, setPromoIdx] = useState(0);
  useEffect(() => {
    if (!open || !cfg.promo_rotate || promos.length < 2) return;
    const t = setInterval(() => setPromoIdx((i) => (i + 1) % promos.length), Math.max(1200, cfg.promo_interval || 3500));
    return () => clearInterval(t);
  }, [open, cfg.promo_rotate, cfg.promo_interval, promos.length]);

  useEffect(() => { if (promoIdx >= promos.length) setPromoIdx(0); }, [promos.length, promoIdx]);

  if (cfg.enabled === false) return null;

  const gridCols = promos.length > 0 ? "md:grid-cols-5" : "md:grid-cols-4";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="absolute left-0 right-0 top-full z-40 border-t border-border bg-header-main shadow-[0_20px_40px_-25px_rgba(0,0,0,0.15)] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-['']"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave ?? onClose}
        >
          <div className={`container-site grid grid-cols-1 gap-10 py-10 ${gridCols}`}>
            {columns.map((col, ci) => (
              <div key={`${col.title}-${ci}`}>
                <p className="eyebrow mb-5">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map((it, li) => (
                    <li key={`${it.label}-${li}`}>
                      <Link
                        to={it.to}
                        onClick={onClose}
                        className="group inline-flex items-center gap-2 text-sm text-foreground/80 transition-colors hover:text-primary"
                      >
                        <span>{it.label}</span>
                        {it.badge ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.16em] text-primary">{it.badge}</span>
                        ) : null}
                        <span className="translate-x-0 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {promos.length > 0 && (
              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {promos.map((p, i) => i === promoIdx && (
                    <motion.div
                      key={`${p.title}-${i}`}
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0"
                    >
                      <Link to={p.href} onClick={onClose} className="group block h-full">
                        <div className="relative h-full min-h-[240px] overflow-hidden">
                          <img src={p.img} alt={p.title} className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                          <div className="absolute bottom-5 left-5 text-white">
                            <p className="mb-1 text-[0.65rem] uppercase tracking-[0.28em]">{p.eyebrow}</p>
                            <p className="font-display text-2xl">{p.title}</p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div className="invisible min-h-[240px]" />
              </div>
            )}
          </div>

          {(cfg.footer_note || cfg.footer_link_label) && (
            <div className="border-t border-border/70">
              <div className="container-site flex flex-wrap items-center justify-between gap-3 py-3">
                <p className="text-xs text-foreground/70">{cfg.footer_note}</p>
                {cfg.footer_link_label ? (
                  <Link to={cfg.footer_link_to || "/collections"} onClick={onClose} className="text-xs uppercase tracking-[0.18em] underline underline-offset-4 hover:text-primary">
                    {cfg.footer_link_label}
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
