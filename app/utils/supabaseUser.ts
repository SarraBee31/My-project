export function supabaseUserId(user: { id?: string, sub?: string } | null | undefined) {
  return user?.id || user?.sub || null
}

export async function resolveAuthUser(override?: { id?: string, sub?: string, email?: string, user_metadata?: Record<string, string> } | null) {
  if (supabaseUserId(override)) return override

  const fromState = useSupabaseUser().value as { id?: string, sub?: string, email?: string, user_metadata?: Record<string, string> } | null
  if (supabaseUserId(fromState)) return fromState

  const client = useSupabaseClient()
  const { data } = await client.auth.getUser()
  return data.user
}
