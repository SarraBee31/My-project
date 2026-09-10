<template>
  <nav class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 py-3 dark:border-stone-700">
    <NuxtLink to="/" class="text-sm font-semibold tracking-tight sm:text-base">
      www.capsuleAssistant.fr
    </NuxtLink>

    <div class="flex items-center gap-2">
      <ClientOnly>
        <span v-if="userStore.firstName" class="hidden text-sm text-muted-foreground sm:inline">
          {{ userStore.firstName }}
        </span>
        <span v-if="logoutError" class="text-xs text-destructive">{{ logoutError }}</span>
        <template v-if="userStore.isLoggedIn">
          <Button as-child variant="ghost" class="h-10 rounded-full px-4">
            <NuxtLink to="/pieces">Pièces</NuxtLink>
          </Button>
          <Button variant="outline" class="h-10 rounded-full px-4" :disabled="pendingLogout" @click="logout">
            {{ pendingLogout ? 'Déconnexion…' : 'Déconnexion' }}
          </Button>
        </template>
        <template v-else>
          <Button as-child variant="ghost" class="h-10 rounded-full px-4">
            <NuxtLink to="/login">Login</NuxtLink>
          </Button>
          <Button as-child class="h-10 rounded-full px-4">
            <NuxtLink to="/signup">Sign up</NuxtLink>
          </Button>
        </template>
      </ClientOnly>
      <client-only>
        <button
          type="button"
          class="flex size-10 items-center justify-center rounded-md"
          aria-label="Basculer le thème"
          @click="toggleDark()"
        >
          <svg v-if="isDark" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </client-only>
    </div>
  </nav>
</template>

<script setup>
import { Button } from '@/components/ui/button'

const userStore = useUserStore()
const isDark = useDark()
const toggleDark = useToggle(isDark)
const pendingLogout = ref(false)
const logoutError = ref(null)

async function logout() {
  pendingLogout.value = true
  logoutError.value = null
  try {
    await userStore.logout()
    await navigateTo('/')
  }
  catch (error) {
    logoutError.value = authErrorMessage(error)
  }
  finally {
    pendingLogout.value = false
  }
}
</script>
