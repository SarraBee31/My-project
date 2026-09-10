<template>
  <div class="flex min-h-[calc(100vh-8.3rem)] items-center justify-center py-10">
    <div class="w-full max-w-md rounded-2xl border border-stone-200 bg-background p-6 shadow-sm sm:p-8 dark:border-stone-700">
      <h1 class="text-2xl font-semibold tracking-tight">Créer un compte</h1>
      <p class="mt-2 text-sm text-muted-foreground">
        Inscription par email et mot de passe. Un email de confirmation sera envoyé.
      </p>

      <p v-if="infoMessage" class="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm dark:border-stone-700 dark:bg-stone-900" role="status">
        {{ infoMessage }}
      </p>
      <p v-if="formError" class="mt-4 text-sm text-destructive" role="alert">
        {{ formError }}
      </p>

      <form v-if="!infoMessage" class="mt-6 space-y-4" novalidate @submit.prevent="onSubmit">
        <AuthField
          id="lastName"
          v-model="lastName"
          label="Nom"
          autocomplete="family-name"
          placeholder="Dupont"
          :error="errors.lastName"
          :disabled="pending"
          @blur="touched.lastName = true"
        />
        <AuthField
          id="firstName"
          v-model="firstName"
          label="Prénom"
          autocomplete="given-name"
          placeholder="Léa"
          :error="errors.firstName"
          :disabled="pending"
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
          :disabled="pending"
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
          :disabled="pending"
          @blur="touched.phone = true"
        />
        <AuthField
          id="postalAddress"
          v-model="postalAddress"
          label="Adresse postale"
          autocomplete="street-address"
          placeholder="12 rue des Fleurs, 75011 Paris"
          :error="errors.postalAddress"
          :disabled="pending"
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
          :disabled="pending"
          @blur="touched.password = true"
        />

        <Button type="submit" class="h-11 w-full rounded-full" :disabled="pending">
          {{ pending ? 'Création…' : 'Créer mon compte' }}
        </Button>
      </form>

      <div v-else class="mt-6 space-y-3">
        <Button class="h-11 w-full rounded-full" :disabled="pending" @click="resendConfirmation">
          {{ pending ? 'Envoi…' : 'Renvoyer l’email de confirmation' }}
        </Button>
        <Button as-child variant="outline" class="h-11 w-full rounded-full">
          <NuxtLink to="/login">Aller à la connexion</NuxtLink>
        </Button>
      </div>

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

const supabase = useSupabaseClient()
const sessionUser = useSupabaseUser()
const userStore = useUserStore()
const config = useRuntimeConfig()

if (sessionUser.value) {
  await navigateTo(userStore.aestheticId ? '/pieces' : '/aesthetic')
}

const lastName = ref('')
const firstName = ref('')
const email = ref('')
const phone = ref('')
const postalAddress = ref('')
const password = ref('')
const submitted = ref(false)
const pending = ref(false)
const formError = ref(null)
const infoMessage = ref(null)
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

async function onSubmit() {
  submitted.value = true
  formError.value = null
  infoMessage.value = null
  if (Object.values(errors.value).some(Boolean)) return

  pending.value = true
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.value.trim().toLowerCase(),
      password: password.value,
      options: {
        emailRedirectTo: config.public.confirmUrl,
        data: {
          username: `${firstName.value.trim()} ${lastName.value.trim()}`.trim(),
          first_name: firstName.value.trim(),
          last_name: lastName.value.trim(),
          phone: phone.value.trim(),
          postal_address: postalAddress.value.trim(),
        },
      },
    })
    if (error) throw error
    if (data.user?.identities && data.user.identities.length === 0) {
      throw new Error('Un compte existe déjà avec cet email. Connecte-toi, ou confirme d’abord ton email.')
    }

    if (!data.session) {
      infoMessage.value = `Un email de confirmation a été envoyé à ${email.value.trim().toLowerCase()}. Clique le lien (il ouvre le site Vercel) pour activer ton compte, puis reconnecte-toi.`
      return
    }

    await userStore.saveProfile({
      lastName: lastName.value,
      firstName: firstName.value,
      phone: phone.value,
      postalAddress: postalAddress.value,
    }, data.user)
    await navigateTo('/aesthetic')
  }
  catch (error) {
    formError.value = authErrorMessage(error)
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
    infoMessage.value = `Un nouvel email de confirmation a été envoyé à ${email.value.trim().toLowerCase()}.`
  }
  catch (error) {
    formError.value = authErrorMessage(error)
  }
  finally {
    pending.value = false
  }
}
</script>
