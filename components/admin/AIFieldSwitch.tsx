import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  label: string;
  /** Called when the switch is turned ON. Return the AI-generated text. */
  onGenerate: () => Promise<string | void>;
  /** Optional title/tooltip shown on hover */
  title?: string;
};

/**
 * A pill switch that toggles an "AI-written" mode for a given field.
 * Turning it ON invokes onGenerate() and shows a spinner until it resolves.
 * Turning it OFF simply marks the field as manually edited again.
 */
export function AIFieldSwitch({ label, onGenerate, title }: Props) {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    if (!on) {
      setBusy(true);
      try {
        await onGenerate();
        setOn(true);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "AI generation failed");
      } finally {
        setBusy(false);
      }
    } else {
      setOn(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={title ?? `Use AI to write ${label.toLowerCase()}`}
      className={`group inline-flex items-center gap-2 rounded-full border pl-2 pr-2.5 h-6 text-[10px] uppercase tracking-[0.18em] transition-colors ${
        on
          ? "bg-primary/10 border-primary/40 text-primary"
          : "bg-background border-foreground/20 text-muted-foreground hover:text-foreground"
      }`}
    >
      <span
        className={`relative inline-block h-3 w-6 rounded-full transition-colors ${
          on ? "bg-primary" : "bg-foreground/25"
        }`}
      >
        <span
          className={`absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-white shadow transition-all ${
            on ? "left-[calc(100%-0.7rem)]" : "left-0.5"
          }`}
        />
      </span>
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
      <span>AI</span>
    </button>
  );
}
