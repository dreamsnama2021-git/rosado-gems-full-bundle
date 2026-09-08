import { ReactNode, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export type WizardStep = {
  key: string;
  title: string;
  description?: string;
  content: ReactNode;
  /** Return an error string to block moving forward. */
  validate?: () => string | null;
};

/**
 * Stepwise admin dialog: same shell as AdminFormDialog, but content is split
 * into guided steps with a progress rail and Back / Next / Save controls.
 */
export function AdminWizardDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  steps,
  onSave,
  saving = false,
  saveLabel = "Save product",
  onStepError,
  initialStep = 0,
  onStepChange,
  footerNote,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  subtitle?: string;
  steps: WizardStep[];
  onSave: () => void | Promise<void>;
  saving?: boolean;
  saveLabel?: string;
  onStepError?: (msg: string) => void;
  /** Step to resume on when the dialog opens. */
  initialStep?: number;
  onStepChange?: (index: number) => void;
  footerNote?: ReactNode;
}) {
  const [i, setI] = useState(initialStep);

  useEffect(() => {
    if (open) setI(Math.max(0, Math.min(steps.length - 1, initialStep)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialStep]);

  const step = steps[Math.min(i, steps.length - 1)];
  const isLast = i === steps.length - 1;

  function go(next: number) {
    if (next > i) {
      for (let k = i; k < next; k++) {
        const err = steps[k]?.validate?.();
        if (err) {
          onStepError?.(err);
          setI(k);
          onStepChange?.(k);
          return;
        }
      }
    }
    const clamped = Math.max(0, Math.min(steps.length - 1, next));
    setI(clamped);
    onStepChange?.(clamped);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-screen max-w-[1200px] sm:w-[96vw] p-0 gap-0 rounded-none sm:rounded-md
          h-[100dvh] max-h-[100dvh] sm:h-[92vh] sm:max-h-[92vh]
          grid grid-rows-[auto_auto_1fr_auto] overflow-hidden"
      >
        <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-background/60 backdrop-blur">
          <h2 className="font-display text-lg sm:text-xl md:text-2xl truncate pr-10">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate pr-10">{subtitle}</p>}
        </header>

        {/* Step rail */}
        <nav className="border-b border-border bg-muted/30 px-3 sm:px-6 py-2.5 overflow-x-auto">
          <ol className="flex items-center gap-1.5 sm:gap-2 min-w-max">
            {steps.map((s, idx) => {
              const done = idx < i;
              const active = idx === i;
              return (
                <li key={s.key} className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => go(idx)}
                    className={`group flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-left transition-colors ${
                      active ? "bg-foreground text-background" : "hover:bg-foreground/5"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                        active
                          ? "border-background/40 bg-background/15"
                          : done
                            ? "border-foreground/40 bg-foreground/10"
                            : "border-foreground/25 text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="h-3 w-3" /> : idx + 1}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.18em] whitespace-nowrap">
                      {s.title}
                    </span>
                  </button>
                  {idx < steps.length - 1 && (
                    <span aria-hidden className="h-px w-4 sm:w-6 bg-border" />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {step?.description && (
            <p className="mb-4 text-xs text-muted-foreground">{step.description}</p>
          )}
          <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-12">
            {step?.content}
          </div>
        </div>

        <footer
          className="px-4 sm:px-6 py-3 border-t border-border bg-background/95 backdrop-blur
            flex items-center gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <span className="hidden sm:block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Step {i + 1} of {steps.length}
          </span>
          {footerNote ? (
            <span className="hidden md:block text-[11px] text-muted-foreground">{footerNote}</span>
          ) : null}
          <div className="ml-auto flex flex-1 sm:flex-none gap-2">
            <button
              type="button"
              onClick={() => (i === 0 ? onOpenChange(false) : go(i - 1))}
              className="h-10 sm:h-9 flex-1 sm:flex-none px-4 rounded-sm border border-border text-xs uppercase tracking-[0.2em] inline-flex items-center justify-center gap-1.5"
            >
              {i === 0 ? "Cancel" : (<><ChevronLeft className="h-3.5 w-3.5" /> Back</>)}
            </button>
            {!isLast ? (
              <button
                type="button"
                onClick={() => go(i + 1)}
                className="h-10 sm:h-9 flex-1 sm:flex-none px-5 rounded-sm bg-foreground text-background text-xs uppercase tracking-[0.2em] inline-flex items-center justify-center gap-1.5"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className={`h-10 sm:h-9 flex-1 sm:flex-none px-5 rounded-sm text-xs uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 disabled:opacity-60 ${
                isLast ? "bg-foreground text-background" : "border border-border"
              }`}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? "Saving…" : isLast ? saveLabel : "Save"}
            </button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
