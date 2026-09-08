import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminListProducts, adminDeleteProduct, adminSetProductStatus } from "@/lib/admin.functions";
import { toast } from "sonner";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";

const q = queryOptions({ queryKey: ["admin", "products"], queryFn: () => adminListProducts() });

export const Route = createFileRoute("/_authenticated/admin/products/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  errorComponent: ({ error }) => <p className="text-sm text-red-600">{error.message}</p>,
  notFoundComponent: () => <p>Not found</p>,
  component: List,
});

function List() {
  const data = useSuspenseQuery(q).data;
  const qc = useQueryClient();
  const del = useServerFn(adminDeleteProduct);
  const setStatus = useServerFn(adminSetProductStatus);

  async function toggleStatus(id: string, current: string) {
    const next = current === "draft" ? "published" : "draft";
    try {
      await setStatus({ data: { id, status: next } });
      toast.success(next === "draft" ? "Moved to draft" : "Published");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  const [editId, setEditId] = useState<string | null>(null);

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "products"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl">Products</h1>
        <button onClick={() => setEditId("new")}
          className="h-10 px-4 rounded-sm bg-foreground text-background text-xs uppercase tracking-[0.2em]">+ New product</button>
      </div>
      <div className="rounded-sm border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-header-top text-left text-xs uppercase tracking-[0.15em]"><tr><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3">Flags</th><th className="p-3"></th></tr></thead>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {p.images?.[0] && <img src={p.images[0]} alt="" className="h-10 w-10 object-cover rounded-sm" />}
                    <div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.slug}</p></div>
                  </div>
                </td>
                <td className="p-3 text-xs">{p.categories?.name ?? "—"}</td>
                <td className="p-3">₹{Number(p.price).toLocaleString("en-IN")}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">
                  {(p.status ?? "published") === "draft" ? (
                    <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-amber-800">Draft</span>
                  ) : (
                    <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-emerald-800">Published</span>
                  )}
                </td>
                <td className="p-3 text-xs">{[p.is_new && "New", p.is_bestseller && "Best", p.is_trending && "Trend"].filter(Boolean).join(" · ")}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => toggleStatus(p.id, p.status ?? "published")} className="text-xs uppercase tracking-[0.2em] mr-4 hover:text-primary">
                    {(p.status ?? "published") === "draft" ? "Publish" : "Unpublish"}
                  </button>
                  <button onClick={() => setEditId(p.id)} className="text-xs uppercase tracking-[0.2em] mr-4 hover:text-primary">Edit</button>
                  <button onClick={() => remove(p.id)} className="text-xs uppercase tracking-[0.2em] text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProductFormDialog
        id={editId}
        open={editId !== null}
        onOpenChange={(v) => { if (!v) setEditId(null); }}
      />
    </div>
  );
}
