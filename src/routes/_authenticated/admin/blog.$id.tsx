import { createFileRoute, redirect } from "@tanstack/react-router";

// The blog editor is now a popup on /admin/blog. Redirect legacy links there.
export const Route = createFileRoute("/_authenticated/admin/blog/$id")({
  beforeLoad: () => { throw redirect({ to: "/admin/blog" }); },
  component: () => null,
});
