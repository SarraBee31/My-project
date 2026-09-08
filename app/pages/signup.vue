<template>
  <div class="flex min-h-[calc(100vh-8.3rem)] items-center justify-center py-10">
    <div class="w-full max-w-md rounded-2xl border border-stone-200 bg-background p-6 shadow-sm sm:p-8 dark:border-stone-700">
      <h1 class="text-2xl font-semibold tracking-tight">Créer un compte</h1>
      <p class="mt-2 text-sm text-muted-foreground">
        Remplis tous les champs. Les messages t’indiquent ce qui manque ou ce qui n’est pas valide.
      </p>

      <form class="mt-6 space-y-4" novalidate @submit.prevent="onSubmit">
        <AuthField
          id="lastName"
          v-model="lastName"
          label="Nom"
          autocomplete="family-name"
          placeholder="Dupont"
          :error="errors.lastName"
          @blur="touched.lastName = true"
        />
        <AuthField
          id="firstName"
          v-model="firstName"
          label="Prénom"
          autocomplete="given-name"
          placeholder="Léa"
          :error="errors.firstName"
          @blur="touched.firstName = true"
        />
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
          id="phone"
          v-model="phone"
          label="Numéro"
          type="tel"
          autocomplete="tel"
          placeholder="06 12 34 56 78"
          :error="errors.phone"
          @blur="touched.phone = true"
        />
        <AuthField
          id="postalAddress"
          v-model="postalAddress"
          label="Adresse postale"
          autocomplete="street-address"
          placeholder="12 rue des Fleurs, 75011 Paris"
          :error="errors.postalAddress"
          @blur="touched.postalAddress = true"
        />
        <AuthField
          id="password"
          v-model="password"
          label="Mot de passe"
          type="password"
          autocomplete="new-password"
          placeholder="8 caractères minimum"
          :error="errors.password"
          @blur="touched.password = true"
        />

        <Button type="submit" class="h-11 w-full rounded-full">Continuer</Button>
      </form>

      <p class="mt-6 text-center text-sm text-muted-foreground">
        Déjà un compte ?
        <NuxtLink to="/login" class="font-medium text-foreground underline-offset-4 hover:underline">
          Se connecter
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'

useSeoMeta({ title: 'Sign up — Capsule Wardrobe' })

const userStore = useUserStore()

const lastName = ref('')
const firstName = ref('')
const email = ref('')
const phone = ref('')
const postalAddress = ref('')
const password = ref('')

const submitted = ref(false)
const touched = reactive({
  lastName: false,
  firstName: false,
  email: false,
  phone: false,
  postalAddress: false,
  password: false,
})

const errors = computed(() => {
  const show = (key) => submitted.value || touched[key]
  return {
    lastName: show('lastName') ? validateLastName(lastName.value) : null,
    firstName: show('firstName') ? validateFirstName(firstName.value) : null,
    email: show('email') ? validateEmail(email.value) : null,
    phone: show('phone') ? validatePhone(phone.value) : null,
    postalAddress: show('postalAddress') ? validatePostalAddress(postalAddress.value) : null,
    password: show('password') ? validatePassword(password.value) : null,
  }
})

function onSubmit() {
  submitted.value = true
  const hasError = Object.values(errors.value).some(Boolean)
  if (hasError) return

  userStore.register({
    lastName: lastName.value,
    firstName: firstName.value,
    email: email.value,
    phone: phone.value,
    postalAddress: postalAddress.value,
    password: password.value,
  })

  navigateTo('/aesthetic')
}
</script>
