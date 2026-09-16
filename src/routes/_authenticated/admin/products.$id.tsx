import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  beforeLoad: () => { throw redirect({ to: "/admin/products" }); },
  component: () => null,
});
