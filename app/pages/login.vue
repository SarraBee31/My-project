<template>
  <div class="flex min-h-[calc(100vh-8.3rem)] items-center justify-center py-10">
    <div class="w-full max-w-md rounded-2xl border border-stone-200 bg-background p-6 shadow-sm sm:p-8 dark:border-stone-700">
      <h1 class="text-2xl font-semibold tracking-tight">Connexion</h1>
      <p class="mt-2 text-sm text-muted-foreground">
        Connecte-toi avec l’email et le mot de passe de ton compte.
      </p>

      <form class="mt-6 space-y-4" novalidate @submit.prevent="onSubmit">
        <AuthField
          id="email"
          v-model="email"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="lea@mail.fr"
          :error="errors.email"
          :disabled="pending"
          @blur="touched.email = true"
        />
        <AuthField
          id="password"
          v-model="password"
          label="Mot de passe"
          type="password"
          autocomplete="current-password"
          placeholder="Ton mot de passe"
          :error="errors.password"
          :disabled="pending"
          @blur="touched.password = true"
        />

        <p v-if="formError" class="text-sm text-destructive" role="alert">
          {{ formError }}
        </p>
        <p v-if="infoMessage" class="text-sm text-muted-foreground" role="status">
          {{ infoMessage }}
        </p>

        <Button type="submit" class="h-11 w-full rounded-full" :disabled="pending">
          {{ pending ? 'Connexion…' : 'Se connecter' }}
        </Button>
        <Button
          v-if="needsConfirmation"
          type="button"
          variant="outline"
          class="h-11 w-full rounded-full"
          :disabled="pending"
          @click="resendConfirmation"
        >
          Renvoyer l’email de confirmation
        </Button>
      </form>

      <p class="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?
        <NuxtLink to="/signup" class="font-medium text-foreground underline-offset-4 hover:underline">
          Créer un compte
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'

useSeoMeta({ title: 'Login — Capsule Wardrobe' })

const supabase = useSupabaseClient()
const sessionUser = useSupabaseUser()
const userStore = useUserStore()
const config = useRuntimeConfig()

if (sessionUser.value) {
  await navigateTo(userStore.aestheticId ? '/pieces' : '/aesthetic')
}

const email = ref('')
const password = ref('')
const submitted = ref(false)
const pending = ref(false)
const formError = ref(null)
const infoMessage = ref(null)
const needsConfirmation = ref(false)
const touched = reactive({
  email: false,
  password: false,
})

const errors = computed(() => {
  const show = (key) => submitted.value || touched[key]
  return {
    email: show('email') ? validateEmail(email.value) : null,
    password: show('password') ? validatePassword(password.value) : null,
  }
})

async function onSubmit() {
  submitted.value = true
  formError.value = null
  infoMessage.value = null
  needsConfirmation.value = false
  if (errors.value.email || errors.value.password) return

  pending.value = true
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim().toLowerCase(),
      password: password.value,
    })
    if (error) throw error

    await userStore.syncFromSupabase(data.user)
    await navigateTo(userStore.aestheticId ? '/pieces' : '/aesthetic')
  }
  catch (error) {
    const message = authErrorMessage(error)
    formError.value = message
    needsConfirmation.value = message.toLowerCase().includes('confirme')
  }
  finally {
    pending.value = false
  }
}

async function resendConfirmation() {
  formError.value = null
  pending.value = true
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.value.trim().toLowerCase(),
      options: { emailRedirectTo: config.public.confirmUrl },
    })
    if (error) throw error
    infoMessage.value = `Un email de confirmation a été renvoyé à ${email.value.trim().toLowerCase()}. Le lien ouvre le site Vercel.`
  }
  catch (error) {
    formError.value = authErrorMessage(error)
  }
  finally {
    pending.value = false
  }
}
</script>
