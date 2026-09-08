import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { adminListMessages } from "@/lib/admin.functions";

const q = queryOptions({ queryKey: ["admin", "messages"], queryFn: () => adminListMessages() });

export const Route = createFileRoute("/_authenticated/admin/messages")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  errorComponent: ({ error }) => <p className="text-sm text-red-600">{error.message}</p>,
  notFoundComponent: () => <p>Not found</p>,
  component: Messages,
});

function Messages() {
  const data = useSuspenseQuery(q).data;
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Contact messages</h1>
      <div className="grid gap-3">
        {data.map((m) => (
          <div key={m.id} className="border border-border p-4 rounded-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">{m.name} <span className="text-xs text-muted-foreground">· {m.email}{m.phone ? ` · ${m.phone}` : ""}</span></p>
              <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
            </div>
            {m.subject && <p className="text-sm font-medium mb-1">{m.subject}</p>}
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{m.message}</p>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">No messages.</p>}
      </div>
    </div>
  );
}
