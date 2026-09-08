<template>
  <div class="flex min-h-[calc(100vh-8.3rem)] items-center justify-center py-10">
    <div class="w-full max-w-md rounded-2xl border border-stone-200 bg-background p-6 shadow-sm sm:p-8 dark:border-stone-700">
      <h1 class="text-2xl font-semibold tracking-tight">Connexion</h1>
      <p class="mt-2 text-sm text-muted-foreground">
        Entre ton email et ton mot de passe. Un message s’affiche si un champ est vide ou invalide.
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
          @blur="touched.password = true"
        />

        <p v-if="formError" class="text-sm text-destructive" role="alert">
          {{ formError }}
        </p>

        <Button type="submit" class="h-11 w-full rounded-full">Se connecter</Button>
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

const userStore = useUserStore()

const email = ref('')
const password = ref('')
const submitted = ref(false)
const formError = ref(null)
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

function onSubmit() {
  submitted.value = true
  formError.value = null
  if (errors.value.email || errors.value.password) return

  const loginError = userStore.login(email.value, password.value)
  if (loginError) {
    formError.value = loginError
    return
  }

  navigateTo(userStore.aestheticId ? '/' : '/aesthetic')
}
</script>
