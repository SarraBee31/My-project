<template>
  <section class="flex flex-col gap-6 lg:max-w-xl">
    <div class="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <img
        src="/images/capsule-hero.png"
        alt="Capsule wardrobe rail with timeless pieces"
        class="h-48 w-full object-cover sm:h-64 lg:h-72"
      >
    </div>

    <div class="space-y-3 text-center lg:text-left">
      <p class="text-xs font-medium uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
        Capsule Wardrobe
      </p>
      <h1 class="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50">
        {{ heading }}
      </h1>
      <p class="text-sm leading-relaxed text-stone-600 sm:text-base dark:text-stone-300">
        <template v-if="userStore.aestheticLabel">
          Préférence enregistrée : {{ userStore.aestheticLabel }}.
        </template>
        <template v-else>
          Fewer pieces, more style. Rejoins la liste pour être prévenu·e du lancement.
        </template>
      </p>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
      <Button as-child class="h-11 w-full rounded-full sm:w-auto">
        <NuxtLink to="/signup">Créer un compte</NuxtLink>
      </Button>
      <Button as-child variant="outline" class="h-11 w-full rounded-full sm:w-auto">
        <NuxtLink to="/login">Se connecter</NuxtLink>
      </Button>
    </div>
  </section>
</template>

<script setup>
import { Button } from '@/components/ui/button'

const userStore = useUserStore()

const heading = computed(() => {
  if (!userStore.firstName) return 'Capsule Wardrobe coming soon'
  if (userStore.aestheticLabel) return `${userStore.firstName}, ta capsule ${userStore.aestheticLabel} arrive`
  return `${userStore.firstName}, ta capsule arrive bientôt`
})
</script>
