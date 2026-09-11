export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()
  const userStore = useUserStore()
  const profile = ref(null)

  watch(user, async (sessionUser) => {
    const userId = supabaseUserId(sessionUser)
    if (!userId) return

    try {
      await userStore.syncFromSupabase()
      userStore.profileError = null
      profile.value = {
        id: userId,
        username: usernameFromNames(userStore.firstName, userStore.lastName) || null,
        aesthetic_id: userStore.aestheticId,
      }
    }
    catch (error) {
      console.error(error)
      userStore.profileError = authErrorMessage(error)
    }
  }, { immediate: true })
})
