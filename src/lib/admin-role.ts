// Role checks read the caller's own row in public.user_roles, which is allowed
// by the "Users see their own roles" RLS policy. The has_role() SECURITY DEFINER
// function is intentionally not executable by anon/authenticated API roles.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function isAdminUser(client: any, userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) return false;
  return !!data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function assertAdminUser(client: any, userId: string | undefined | null): Promise<void> {
  if (!(await isAdminUser(client, userId))) throw new Error("Forbidden: admin only");
}
