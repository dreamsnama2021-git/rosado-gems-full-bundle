import { useEffect, useState } from "react";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RichEditor } from "@/components/admin/RichEditor";
import { SingleImageUpload } from "@/components/admin/ImageUpload";
import { AIFieldSwitch } from "@/components/admin/AIFieldSwitch";
import { AdminFormDialog, AdminFormCol, adminField } from "@/components/admin/AdminFormDialog";
import { aiGenerate } from "@/lib/ai-content.functions";
import {
  adminGetProductCategory, adminUpsertProductCategory,
  adminGetBlogCategory, adminUpsertBlogCategory,
} from "@/lib/categories.functions";

type Kind = "product" | "blog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cat = any;

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

function empty(): Cat {
  return {
    name: "", slug: "", description: "", description_html: "",
    hero_image: "", meta_title: "", meta_description: "", sort_order: 0,
  };
}

export function CategoryFormDialog({
  kind, id, open, onOpenChange,
}: {
  kind: Kind;
  id: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const isNew = id === "new" || id === null;
  const qc = useQueryClient();
  const getFn = kind === "product" ? adminGetProductCategory : adminGetBlogCategory;
  const upsertFn = kind === "product" ? adminUpsertProductCategory : adminUpsertBlogCategory;
  const upsert = useServerFn(upsertFn);
  const gen = useServerFn(aiGenerate);
  const listKey = ["admin", kind === "product" ? "product-categories" : "blog-categories"];

  const catQ = useQuery(queryOptions({
    queryKey: ["admin", "category", kind, id],
    queryFn: () => getFn({ data: { id: id! } }),
    enabled: open && !isNew && !!id,
  }));

  const [c, setC] = useState<Cat>(empty());
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isNew) { setC(empty()); setSlugTouched(false); }
    else if (catQ.data) { setC(catQ.data); setSlugTouched(true); }
  }, [open, isNew, catQ.data]);

  function upd<K extends keyof Cat>(k: K, v: Cat[K]) { setC((s: Cat) => ({ ...s, [k]: v })); }

  async function save() {
    if (!c.name) { toast.error("Name is required"); return; }
    const slug = c.slug || slugify(c.name);
    setSaving(true);
    try {
      await upsert({ data: {
        ...c, slug,
        sort_order: Number(c.sort_order) || 0,
        id: isNew ? undefined : c.id,
      }});
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: listKey });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setSaving(false); }
  }

  const { label, input, textarea } = adminField;
  const title = isNew
    ? `New ${kind === "product" ? "product" : "blog"} category`
    : `Edit: ${c.name || "Untitled"}`;

  return (
    <AdminFormDialog
      open={open} onOpenChange={onOpenChange}
      title={title}
      subtitle="Name, image, description and SEO for this category."
      onSave={save} saving={saving}
    >
      <AdminFormCol span={8} title="Content">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
              <label className={label}>Name</label>
              <AIFieldSwitch label="Name" onGenerate={async () => {
                const seed = c.name || c.description || `${kind} category for Rosado Gems`;
                const r = await gen({ data: { kind: "page-title", context: seed } });
                upd("name", r.text ?? "");
                if (!slugTouched) upd("slug", slugify(r.text ?? ""));
              }} />
            </div>
            <input className={input} value={c.name}
              onChange={(e) => { upd("name", e.target.value); if (!slugTouched) upd("slug", slugify(e.target.value)); }} />
          </div>
          <div>
            <label className={label}>Slug</label>
            <input className={input} value={c.slug}
              onChange={(e) => { setSlugTouched(true); upd("slug", slugify(e.target.value)); }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
            <label className={label}>Short description</label>
            <AIFieldSwitch label="Description" onGenerate={async () => {
              if (!c.name) throw new Error("Enter a name first");
              const r = await gen({ data: { kind: "page-excerpt", context: `${c.name} — ${kind} category` } });
              upd("description", r.text ?? "");
            }} />
          </div>
          <textarea rows={2} className={textarea}
            value={c.description ?? ""} onChange={(e) => upd("description", e.target.value)} />
        </div>

        <div>
          <label className={label}>Full description (rich)</label>
          <RichEditor
            value={c.description_html ?? ""}
            onChange={(html) => upd("description_html", html)}
            placeholder="Tell the story of this category…"
            minHeight={280}
          />
        </div>
      </AdminFormCol>

      <AdminFormCol span={4} title="Media & details">
        <div>
          <label className={label}>Hero image</label>
          <SingleImageUpload value={c.hero_image ?? ""} onChange={(url) => upd("hero_image", url)} />
        </div>
        <div>
          <label className={label}>Sort order</label>
          <input type="number" className={input} value={c.sort_order ?? 0}
            onChange={(e) => upd("sort_order", Number(e.target.value))} />
        </div>

        <div className="pt-4 mt-2 border-t border-border">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h3 className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">SEO</h3>
            <AIFieldSwitch label="SEO" onGenerate={async () => {
              if (!c.name) throw new Error("Enter a name first");
              const r = await gen({ data: {
                kind: "page-seo",
                context: `${c.name}. ${(c.description ?? "").slice(0, 300)}`,
              } });
              if (r.json) {
                upd("meta_title", r.json.meta_title ?? "");
                upd("meta_description", r.json.meta_description ?? "");
              }
            }} />
          </div>
          <div className="space-y-4">
            <div>
              <label className={label}>Meta title</label>
              <input className={input} value={c.meta_title ?? ""} onChange={(e) => upd("meta_title", e.target.value)} />
            </div>
            <div>
              <label className={label}>Meta description</label>
              <textarea rows={4} className={textarea} value={c.meta_description ?? ""}
                onChange={(e) => upd("meta_description", e.target.value)} />
            </div>
          </div>
        </div>
      </AdminFormCol>
    </AdminFormDialog>
  );
}
