<template>
  <div class="flex min-h-[calc(100vh-8.3rem)] items-center justify-center py-10">
    <div class="w-full max-w-md rounded-2xl border border-stone-200 bg-background p-6 shadow-sm sm:p-8 dark:border-stone-700">
      <h1 class="text-2xl font-semibold tracking-tight">Confirmation de l’email</h1>
      <p class="mt-2 text-sm text-muted-foreground">
        {{ statusMessage }}
      </p>
      <p v-if="formError" class="mt-4 text-sm text-destructive" role="alert">
        {{ formError }}
      </p>
      <div class="mt-6">
        <Button as-child variant="outline" class="h-11 w-full rounded-full">
          <NuxtLink to="/login">Retour à la connexion</NuxtLink>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/database.types'
import { Button } from '@/components/ui/button'

useSeoMeta({ title: 'Confirmation email' })

const route = useRoute()
const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const userStore = useUserStore()

const formError = ref(null)
const statusMessage = ref('Validation du lien de confirmation…')

async function goNext() {
  try {
    const { data } = await supabase.auth.getUser()
    await userStore.syncFromSupabase(data.user)
    await navigateTo(userStore.aestheticId ? '/pieces' : '/aesthetic')
  }
  catch (error) {
    formError.value = authErrorMessage(error)
    statusMessage.value = 'Email confirmé, mais le profil n’a pas pu être lu ou enregistré.'
  }
}

onMounted(async () => {
  const errorDescription = route.query.error_description || route.query.error
  if (errorDescription) {
    formError.value = authErrorMessage({ message: String(errorDescription) })
    statusMessage.value = 'Le lien de confirmation n’a pas fonctionné.'
    return
  }

  const tokenHash = route.query.token_hash
  const type = route.query.type || 'email'

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: String(tokenHash),
      type,
    })
    if (error) {
      formError.value = authErrorMessage(error)
      statusMessage.value = 'Impossible de confirmer cet email.'
      return
    }
  }

  if (user.value) {
    statusMessage.value = 'Email confirmé. Chargement du profil…'
    await goNext()
  }
})

watch(user, async (sessionUser) => {
  if (!sessionUser || formError.value) return
  statusMessage.value = 'Email confirmé. Chargement du profil…'
  await goNext()
})
</script>
