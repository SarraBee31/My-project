<template>
  <div class="flex min-h-[calc(100vh-8.3rem)] flex-col py-8">
    <div class="mx-auto w-full max-w-3xl">
      <p class="text-sm text-muted-foreground">
        {{ userStore.firstName }}, choisis le style de ta capsule.
      </p>
      <h1 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
        Choisis ton aesthetic
      </h1>
      <p v-if="selectionError" class="mt-3 text-sm text-destructive" role="alert">
        {{ selectionError }}
      </p>

      <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          v-for="option in aestheticOptions"
          :key="option.id"
          type="button"
          class="rounded-2xl border p-4 text-left transition hover:border-stone-400 dark:hover:border-stone-500"
          :class="selectedId === option.id
            ? 'border-stone-900 bg-stone-100 ring-2 ring-stone-900 dark:border-stone-100 dark:bg-stone-900 dark:ring-stone-100'
            : 'border-stone-200 dark:border-stone-700'"
          @click="selectedId = option.id; selectionError = null"
        >
          <span class="block text-base font-medium">{{ option.label }}</span>
          <span class="mt-1 block text-sm text-muted-foreground">{{ option.description }}</span>
        </button>
      </div>

      <Button class="mt-6 h-11 w-full rounded-full sm:w-auto sm:px-8" @click="confirm">
        Valider mon aesthetic
      </Button>
    </div>
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'

useSeoMeta({ title: 'Choisis ton aesthetic' })

const userStore = useUserStore()

if (!userStore.isLoggedIn) {
  await navigateTo('/signup')
}

const selectedId = ref(userStore.aestheticId)
const selectionError = ref(null)

function confirm() {
  if (!selectedId.value) {
    selectionError.value = 'Choisis un aesthetic pour continuer.'
    return
  }

  userStore.setAesthetic(selectedId.value)
  navigateTo('/')
}
</script>
