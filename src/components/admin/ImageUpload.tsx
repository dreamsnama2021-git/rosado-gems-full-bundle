import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminUploadMedia } from "@/lib/media.functions";
import { ACCEPT_ATTR, ALLOWED_LABEL, validateImageFile } from "@/lib/media-constants";
import { UploadTaskList, useUploadTasks } from "@/lib/upload-tasks";
import { toast } from "sonner";
import { Upload, X, ImageIcon, GripVertical, AlertCircle } from "lucide-react";
import { ImageCropDialog } from "./ImageCropDialog";


function uploadErrorMessage(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e ?? "");
  if (/forbidden/i.test(raw)) return "You don't have permission to upload images.";
  if (/unauthorized|401/i.test(raw)) return "Your session expired. Please sign in again.";
  if (/network|fetch/i.test(raw)) return "Network error — the upload didn't reach the server.";
  return raw || "Upload failed. Please try again.";
}

function ErrorNote({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-2 rounded-sm border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-[11px] text-destructive">
      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-[1px]" />
      <span className="flex-1 whitespace-pre-line break-words">{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss error" className="shrink-0 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface SingleImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  crop?: boolean;
  aspect?: number;
}

export function SingleImageUpload({
  value,
  onChange,
  crop = false,
  aspect = 1,
}: SingleImageUploadProps) {
  const upload = useServerFn(adminUploadMedia);
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  const { tasks, run, retry, dismiss, busy } = useUploadTasks({
    upload: async (f, dataBase64) => {
      const r = await upload({ data: { filename: f.name, contentType: f.type, dataBase64 } });
      return r.url;
    },
    onUploaded: (url) => {
      onChange(url);
      toast.success("Image uploaded");
    },
    formatError: uploadErrorMessage,
  });

  async function uploadFile(f: File) {
    setError(null);
    await run([f]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function pick(f: File | null) {
    if (!f) return;
    setError(null);
    const invalid = validateImageFile(f);
    if (invalid) {
      setError(invalid);
      toast.error(invalid);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (crop) {
      const url = URL.createObjectURL(f);
      setCropUrl(url);
      setCropFile(f);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    await uploadFile(f);
  }

  function handleCropClose() {
    if (cropUrl) {
      URL.revokeObjectURL(cropUrl);
    }
    setCropUrl(null);
    setCropFile(null);
  }

  async function handleCropConfirm(cropped: File) {
    await uploadFile(cropped);
    handleCropClose();
  }

  function handleWrapperClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    inputRef.current?.click();
  }

  return (
    <div className="@container space-y-2">
      <div
        onClick={handleWrapperClick}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0] ?? null); }}
        className={`group relative flex flex-col @sm:flex-row items-stretch @sm:items-center gap-3 @sm:gap-4 rounded-sm border border-dashed p-2 transition-all duration-200 cursor-pointer hover:border-primary/50 hover:bg-primary/[0.03] active:scale-[0.995] ${over ? "border-primary/70 bg-primary/10 ring-2 ring-primary/20" : "border-current/30"}`}
      >
        {over && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-sm bg-primary/10">
            <span className="text-[10px] uppercase tracking-[0.16em] font-medium text-primary">Drop image here</span>
          </div>
        )}
        <div className="h-24 w-full @sm:h-24 @sm:w-32 @sm:shrink-0 rounded-sm bg-current/10 flex items-center justify-center overflow-hidden">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 opacity-50 group-hover:opacity-70 transition" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-2 h-8 px-2.5 rounded-sm border border-current/30 text-[10px] uppercase tracking-[0.16em] hover:bg-current/10 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 disabled:opacity-60 transition"
            >
              <Upload className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{busy ? "Uploading…" : value ? "Replace" : "Upload image"}</span>
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Remove image"
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-sm border border-current/30 text-[10px] uppercase tracking-[0.16em] text-red-500 hover:bg-red-500/10 hover:border-red-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:opacity-60 transition"
              >
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
          <p className="text-[10px] leading-snug opacity-60">Drag &amp; drop or click upload. {ALLOWED_LABEL}, max 8 MB.</p>
        </div>
      </div>

      <UploadTaskList tasks={tasks} onRetry={retry} onDismiss={dismiss} />
      {error && <ErrorNote message={error} onDismiss={() => setError(null)} />}
      <input ref={inputRef} type="file" accept={ACCEPT_ATTR} className="hidden" onChange={(e) => pick(e.target.files?.[0] ?? null)} />

      {cropUrl && cropFile && (
        <ImageCropDialog
          open
          imageUrl={cropUrl}
          fileName={cropFile.name}
          contentType={cropFile.type}
          aspect={aspect}
          onClose={handleCropClose}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}

interface CropQueueItem {
  url: string;
  file: File;
}

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  crop?: boolean;
  aspect?: number;
}

export function MultiImageUpload({ value, onChange, crop = false, aspect = 1 }: MultiImageUploadProps) {
  const upload = useServerFn(adminUploadMedia);
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [cropQueue, setCropQueue] = useState<CropQueueItem[]>([]);
  const [cropIndex, setCropIndex] = useState(0);

  // Uploads resolve out of band, so append against the freshest list.
  const valueRef = useRef(value);
  valueRef.current = value;

  const { tasks, run, retry, dismiss, busy } = useUploadTasks({
    upload: async (f, dataBase64) => {
      const r = await upload({ data: { filename: f.name, contentType: f.type, dataBase64 } });
      return r.url;
    },
    onUploaded: (url) => {
      const next = [...valueRef.current, url];
      valueRef.current = next;
      onChange(next);
    },
    formatError: (e) => uploadErrorMessage(e),
  });

  async function pick(files: FileList | null) {
    if (!files || !files.length) return;
    setErrors([]);
    const problems: string[] = [];
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      const invalid = validateImageFile(f);
      if (invalid) problems.push(invalid);
      else valid.push(f);
    }
    if (!valid.length) {
      setErrors(problems);
      problems.forEach((p) => toast.error(p));
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (crop) {
      const queue: CropQueueItem[] = valid.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
      setCropQueue(queue);
      setCropIndex(0);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (inputRef.current) inputRef.current.value = "";
    setErrors(problems);
    problems.forEach((p) => toast.error(p));
    const uploaded = await run(valid);
    if (uploaded) toast.success(uploaded === 1 ? "Image uploaded" : `${uploaded} images uploaded`);
  }

  function removeCropQueueItem() {
    const current = cropQueue[cropIndex];
    if (current) URL.revokeObjectURL(current.url);
  }

  function closeCropQueue() {
    // revoke any remaining URLs
    cropQueue.slice(cropIndex).forEach((item) => URL.revokeObjectURL(item.url));
    setCropQueue([]);
    setCropIndex(0);
  }

  async function handleCropConfirm(cropped: File) {
    const current = cropQueue[cropIndex];
    if (!current) return;
    try {
      const ok = await run([cropped]);
      if (ok) toast.success("Image uploaded");
    } finally {
      removeCropQueueItem();
      if (cropIndex + 1 < cropQueue.length) {
        setCropIndex((i) => i + 1);
      } else {
        setCropQueue([]);
        setCropIndex(0);
      }
    }
  }

  function handleCropCancel() {
    closeCropQueue();
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(i: number) { onChange(value.filter((_, idx) => idx !== i)); }
  function moveTo(from: number, to: number) {
    if (from === to) return;
    const next = [...value];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  }

  const currentCrop = cropQueue[cropIndex];

  return (
    <div className="@container space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
        className={`rounded-sm border border-dashed p-2 transition ${over ? "border-current bg-current/10" : "border-current/20"}`}
      >
        <div className="grid grid-cols-2 @sm:grid-cols-3 @lg:grid-cols-4 gap-2 @sm:gap-3">
          {value.map((url, i) => (
            <div
              key={`${url}-${i}`}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.stopPropagation(); if (dragIdx !== null) moveTo(dragIdx, i); setDragIdx(null); }}
              className="group relative aspect-square border border-current/20 rounded-sm overflow-hidden bg-current/10"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute top-1 left-1 bg-black/70 text-white text-[8px] uppercase tracking-widest px-1 py-0.5 rounded-sm">Primary</span>}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove image"
                className="absolute top-1 right-1 h-6 w-6 rounded-sm inline-flex items-center justify-center bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/55 text-white text-[9px] rounded-sm px-1 py-0.5 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <GripVertical className="h-3 w-3" /> drag
              </span>
            </div>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="aspect-square border border-dashed border-current/30 rounded-sm flex flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.16em] opacity-70 hover:opacity-100 hover:bg-current/10 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {busy ? "Uploading…" : "Add"}
          </button>
        </div>
      </div>
      <p className="text-[10px] leading-snug opacity-60">First image is the primary. Drag to reorder. {ALLOWED_LABEL}, up to 8 MB each.</p>

      <UploadTaskList tasks={tasks} onRetry={retry} onDismiss={dismiss} />
      {errors.length > 0 && <ErrorNote message={errors.join("\n")} onDismiss={() => setErrors([])} />}
      <input ref={inputRef} type="file" accept={ACCEPT_ATTR} multiple className="hidden" onChange={(e) => pick(e.target.files)} />

      {currentCrop && (
        <ImageCropDialog
          open
          imageUrl={currentCrop.url}
          fileName={currentCrop.file.name}
          contentType={currentCrop.file.type}
          aspect={aspect}
          onClose={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}

/** Compact square picker for tight spots (e.g. variant rows). No URL field. */
export function ThumbImageUpload({ value, onChange, crop = true, aspect = 1 }: { value: string; onChange: (url: string) => void; crop?: boolean; aspect?: number }) {
  const upload = useServerFn(adminUploadMedia);
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  const { tasks, run, retry, dismiss, busy } = useUploadTasks({
    upload: async (f, dataBase64) => {
      const r = await upload({ data: { filename: f.name, contentType: f.type, dataBase64 } });
      return r.url;
    },
    onUploaded: (url) => {
      onChange(url);
      toast.success("Image uploaded");
    },
    formatError: uploadErrorMessage,
  });

  const active = tasks.find((t) => t.status === "reading" || t.status === "uploading");

  async function uploadFile(f: File) {
    await run([f]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function pick(f: File | null) {
    if (!f) return;
    const invalid = validateImageFile(f);
    if (invalid) {
      toast.error(invalid);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (crop) {
      setCropFile(f);
      setCropUrl(URL.createObjectURL(f));
      return;
    }
    void uploadFile(f);
  }

  function closeCrop() {
    if (cropUrl) URL.revokeObjectURL(cropUrl);
    setCropUrl(null);
    setCropFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const failed = tasks.find((t) => t.status === "error");

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title={value ? "Replace image" : "Upload image"}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0] ?? null); }}
        className={`h-8 w-8 rounded-sm border overflow-hidden grid place-items-center bg-muted/40 transition-colors hover:bg-foreground/5 hover:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 ${over ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
      >
        {active ? (
          <span className="text-[9px] tabular-nums font-medium text-muted-foreground">
            {Math.round(active.progress)}%
          </span>
        ) : value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <Upload className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {failed && (
        <button
          type="button"
          onClick={() => retry(failed.id)}
          title={failed.error || "Upload failed — retry"}
          className="h-8 w-6 grid place-items-center text-destructive hover:bg-destructive/10 rounded-sm"
        >
          <AlertCircle className="h-3.5 w-3.5" />
        </button>
      )}
      {value && !active && (
        <button type="button" onClick={() => onChange("")} title="Remove image" className="h-8 w-6 grid place-items-center text-red-600 hover:bg-red-50 rounded-sm">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <input ref={inputRef} type="file" accept={ACCEPT_ATTR} className="hidden" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      {cropUrl && cropFile && (
        <ImageCropDialog
          open
          imageUrl={cropUrl}
          fileName={cropFile.name}
          contentType={cropFile.type}
          aspect={aspect}
          onClose={closeCrop}
          onConfirm={async (cropped) => { closeCrop(); await uploadFile(cropped); }}
        />
      )}
    </div>
  );
}

