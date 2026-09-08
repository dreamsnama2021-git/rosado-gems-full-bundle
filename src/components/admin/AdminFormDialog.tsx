import { ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

/**
 * Shared admin form dialog: wide popup with a header,
 * a 3-column content grid, and a sticky footer with Save/Cancel.
 *
 * Children should provide the three column slots via `<AdminFormCol span>`.
 */
export function AdminFormDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  onSave,
  saving = false,
  saveLabel = "Save",
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  subtitle?: string;
  onSave: () => void | Promise<void>;
  saving?: boolean;
  saveLabel?: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-screen max-w-[1200px] sm:w-[96vw] p-0 gap-0 rounded-none sm:rounded-md
          h-[100dvh] max-h-[100dvh] sm:h-[92vh] sm:max-h-[92vh]
          grid grid-rows-[auto_1fr_auto] overflow-hidden"
      >
        <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-background/60 backdrop-blur">
          <h2 className="font-display text-lg sm:text-xl md:text-2xl truncate pr-10">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 truncate pr-10">{subtitle}</p>
          )}
        </header>

        <div className="overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-12">
            {children}
          </div>
        </div>

        <footer className="px-4 sm:px-6 py-3 border-t border-border bg-background/95 backdrop-blur
          flex flex-row justify-end gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 sm:h-9 flex-1 sm:flex-none px-4 rounded-sm border border-border text-xs uppercase tracking-[0.2em]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="h-10 sm:h-9 flex-1 sm:flex-none px-5 rounded-sm bg-foreground text-background text-xs uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Saving…" : saveLabel}
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A column inside AdminFormDialog. `span` controls the lg-grid width
 * (out of 12). Use e.g. span={5} for main, span={4} for media, span={3} for meta.
 */
export function AdminFormCol({
  span,
  title,
  children,
  className = "",
}: {
  span: number;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const spans: Record<number, string> = {
    3: "lg:col-span-3",
    4: "lg:col-span-4",
    5: "lg:col-span-5",
    6: "lg:col-span-6",
    7: "lg:col-span-7",
    8: "lg:col-span-8",
    9: "lg:col-span-9",
    12: "lg:col-span-12",
  };
  return (
    <section
      className={`min-w-0 space-y-4 ${spans[span] ?? "lg:col-span-4"} ${className}`}
    >
      {title && (
        <h3 className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground border-b border-border pb-2">
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

/** Shared field styles used by all admin forms. */
export const adminField = {
  label: "block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1",
  input:
    "w-full h-10 border border-foreground/20 bg-background px-3 text-sm rounded-sm focus:outline-none focus:border-foreground/60",
  textarea:
    "w-full border border-foreground/20 bg-background px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-foreground/60",
};
