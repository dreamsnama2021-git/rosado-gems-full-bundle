import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";

export type CategoryOption = { id: string; name: string; slug?: string | null };

export function CategoryMultiSelect({
  options,
  value,
  onChange,
}: {
  options: CategoryOption[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        (c.slug ?? "").toLowerCase().includes(needle),
    );
  }, [options, q]);

  const selected = useMemo(
    () => value.map((id) => options.find((o) => o.id === id)).filter(Boolean) as CategoryOption[],
    [value, options],
  );

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }

  return (
    <div className="mt-1 rounded-sm border border-border">
      <div className="flex items-center gap-2 border-b border-border px-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search categories…"
          className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-border p-2">
          {selected.map((c, i) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px]"
            >
              {i === 0 && <span className="text-[9px] uppercase tracking-wider text-muted-foreground">primary</span>}
              {c.name}
              <button
                type="button"
                onClick={() => toggle(c.id)}
                aria-label={`Remove ${c.name}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="ml-auto text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="max-h-56 divide-y divide-border overflow-y-auto">
        {filtered.map((c) => {
          const checked = value.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-muted/50"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border ${
                  checked ? "border-foreground bg-foreground text-background" : "border-border"
                }`}
              >
                {checked && <Check className="h-3 w-3" />}
              </span>
              <span className="truncate">{c.name}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            {options.length === 0 ? "No categories yet." : "No matches."}
          </p>
        )}
      </div>
    </div>
  );
}
