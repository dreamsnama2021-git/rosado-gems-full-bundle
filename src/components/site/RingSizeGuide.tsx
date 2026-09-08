import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ruler } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getSiteSettings } from "@/lib/site-settings.functions";

/** Standard Indian ring size reference, used when no chart image is uploaded. */
const CHART: Array<[string, string, string]> = [
  ["5", "44.8", "14.3"],
  ["6", "45.9", "14.6"],
  ["7", "47.1", "15.0"],
  ["8", "48.4", "15.4"],
  ["9", "49.6", "15.8"],
  ["10", "50.8", "16.2"],
  ["11", "52.1", "16.6"],
  ["12", "53.1", "16.9"],
  ["13", "54.4", "17.3"],
  ["14", "55.7", "17.7"],
  ["15", "56.9", "18.1"],
  ["16", "58.1", "18.5"],
];

export function RingSizeGuide() {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: ["site-settings"], queryFn: () => getSiteSettings() });
  const s = data as unknown as
    | { ring_size_guide_enabled?: boolean; ring_size_guide_image?: string; ring_size_guide_note?: string }
    | null
    | undefined;

  if (s && s.ring_size_guide_enabled === false) return null;
  const image = s?.ring_size_guide_image ?? "";
  const note = s?.ring_size_guide_note ?? "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
      >
        <Ruler className="h-3.5 w-3.5" /> Ring size guide
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Ring Size Guide</DialogTitle>
            <DialogDescription>
              Measure the inner circumference of a ring that fits you well, then match it below.
            </DialogDescription>
          </DialogHeader>

          {image ? (
            <img src={image} alt="Ring size chart" className="w-full rounded-sm border border-border" />
          ) : (
            <div className="overflow-hidden rounded-sm border border-border">
              <table className="w-full text-sm">
                <thead className="bg-header-top text-[0.62rem] uppercase tracking-[0.18em]">
                  <tr>
                    <th className="px-3 py-2 text-left">Indian size</th>
                    <th className="px-3 py-2 text-left">Circumference (mm)</th>
                    <th className="px-3 py-2 text-left">Diameter (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {CHART.map(([size, circ, dia]) => (
                    <tr key={size} className="border-t border-border">
                      <td className="px-3 py-2">{size}</td>
                      <td className="px-3 py-2">{circ}</td>
                      <td className="px-3 py-2">{dia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {note && <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}
