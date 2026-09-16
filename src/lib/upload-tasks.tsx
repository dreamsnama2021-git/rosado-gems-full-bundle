import { useCallback, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, RotateCcw, X } from "lucide-react";

export type UploadStatus = "reading" | "uploading" | "done" | "error";

export interface UploadTask {
  id: string;
  name: string;
  progress: number; // 0..100
  status: UploadStatus;
  error?: string;
  attempt: number;
}

const MAX_AUTO_RETRIES = 2;

function isRetryable(message: string) {
  return /network|fetch|timeout|502|503|504|temporar/i.test(message);
}

function readAsDataUrl(file: File, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    r.onload = () => {
      onProgress(100);
      resolve(String(r.result));
    };
    r.onerror = () => reject(new Error(`${file.name}: could not be read from your device.`));
    r.readAsDataURL(file);
  });
}

interface Options {
  /** Performs the actual upload and resolves with the stored URL. */
  upload: (file: File, dataBase64: string) => Promise<string>;
  /** Called once per file that uploads successfully. */
  onUploaded: (url: string, file: File) => void;
  /** Turns a thrown error into a human message. */
  formatError: (e: unknown) => string;
}

/**
 * Tracks per-file upload progress with automatic retries for transient
 * failures and a manual retry handle for everything else.
 */
export function useUploadTasks({ upload, onUploaded, formatError }: Options) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const files = useRef(new Map<string, File>());
  const timers = useRef(new Map<string, ReturnType<typeof setInterval>>());

  const patch = useCallback((id: string, next: Partial<UploadTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...next } : t)));
  }, []);

  const stopTick = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearInterval(t);
    timers.current.delete(id);
  }, []);

  /** The server call gives no byte-level feedback, so creep toward 95%. */
  const startTick = useCallback(
    (id: string) => {
      stopTick(id);
      const timer = setInterval(() => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id && t.status === "uploading"
              ? { ...t, progress: Math.min(95, t.progress + Math.max(1, (95 - t.progress) * 0.12)) }
              : t,
          ),
        );
      }, 220);
      timers.current.set(id, timer);
    },
    [stopTick],
  );

  const runTask = useCallback(
    async (id: string, attempt: number): Promise<boolean> => {
      const file = files.current.get(id);
      if (!file) return false;
      patch(id, { status: "reading", progress: 0, error: undefined, attempt });
      try {
        const dataBase64 = await readAsDataUrl(file, (pct) =>
          patch(id, { progress: Math.round(pct * 0.35) }),
        );
        patch(id, { status: "uploading", progress: 38 });
        startTick(id);
        const url = await upload(file, dataBase64);
        stopTick(id);
        patch(id, { status: "done", progress: 100 });
        onUploaded(url, file);
        // Clear the finished row shortly after so the UI settles.
        setTimeout(() => {
          setTasks((prev) => prev.filter((t) => t.id !== id));
          files.current.delete(id);
        }, 1600);
        return true;
      } catch (e) {
        stopTick(id);
        const msg = formatError(e);
        if (isRetryable(msg) && attempt < MAX_AUTO_RETRIES) {
          patch(id, {
            status: "error",
            error: `${msg} Retrying…`,
            attempt,
          });
          await new Promise((r) => setTimeout(r, 600 * 2 ** attempt));
          return runTask(id, attempt + 1);
        }
        patch(id, { status: "error", error: msg, progress: 0, attempt });
        return false;
      }
    },
    [formatError, onUploaded, patch, startTick, stopTick, upload],
  );

  /** Uploads files sequentially; resolves with the count that succeeded. */
  const run = useCallback(
    async (list: File[]) => {
      const entries = list.map((f) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        files.current.set(id, f);
        return { id, file: f };
      });
      setTasks((prev) => [
        ...prev,
        ...entries.map(({ id, file }) => ({
          id,
          name: file.name,
          progress: 0,
          status: "reading" as UploadStatus,
          attempt: 0,
        })),
      ]);
      let ok = 0;
      for (const { id } of entries) {
        if (await runTask(id, 0)) ok += 1;
      }
      return ok;
    },
    [runTask],
  );

  const retry = useCallback((id: string) => void runTask(id, 0), [runTask]);

  const dismiss = useCallback(
    (id: string) => {
      stopTick(id);
      files.current.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    },
    [stopTick],
  );

  const busy = tasks.some((t) => t.status === "reading" || t.status === "uploading");

  return { tasks, run, retry, dismiss, busy };
}

export function UploadTaskList({
  tasks,
  onRetry,
  onDismiss,
}: {
  tasks: UploadTask[];
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (!tasks.length) return null;
  return (
    <ul className="space-y-1.5">
      {tasks.map((t) => (
        <li
          key={t.id}
          className={`rounded-sm border px-2.5 py-2 text-[11px] ${
            t.status === "error" ? "border-destructive/40 bg-destructive/10" : "border-border bg-muted/40"
          }`}
        >
          <div className="flex items-center gap-2">
            {t.status === "done" ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            ) : t.status === "error" ? (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
            ) : (
              <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-muted-foreground/40 border-t-foreground animate-spin" />
            )}
            <span className="flex-1 truncate" title={t.name}>
              {t.name}
            </span>
            <span className="shrink-0 tabular-nums opacity-70">
              {t.status === "done"
                ? "Done"
                : t.status === "error"
                  ? "Failed"
                  : `${Math.round(t.progress)}%`}
            </span>
            {t.status === "error" && (
              <button
                type="button"
                onClick={() => onRetry(t.id)}
                className="shrink-0 inline-flex items-center gap-1 rounded-sm border border-current/30 px-1.5 py-0.5 hover:bg-current/10"
              >
                <RotateCcw className="h-3 w-3" /> Retry
              </button>
            )}
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label={`Dismiss ${t.name}`}
              className="shrink-0 opacity-60 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {t.status !== "error" && (
            <div
              className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-current/15"
              role="progressbar"
              aria-valuenow={Math.round(t.progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Uploading ${t.name}`}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200"
                style={{ width: `${t.progress}%` }}
              />
            </div>
          )}
          {t.status === "error" && t.error && (
            <p className="mt-1 whitespace-pre-line break-words text-destructive">{t.error}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
