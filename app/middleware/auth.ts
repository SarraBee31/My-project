export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()
  const session = useSupabaseSession()
  if (supabaseUserId(user.value) || session.value) return
  return navigateTo('/login')
})
