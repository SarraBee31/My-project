<template>
    <div class="default-layout mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4">
        <the-navbar />
        <p
            v-if="userStore.profileError"
            class="mt-3 text-sm text-destructive"
            role="alert"
        >
            {{ userStore.profileError }}
            <button
                type="button"
                class="ml-2 underline-offset-2 hover:underline"
                :disabled="pendingReconnect"
                @click="reconnect"
            >
                {{ pendingReconnect ? 'Déconnexion…' : 'Se reconnecter' }}
            </button>
        </p>
        <div class="flex-auto">
            <slot />
        </div>
        <the-footer />
    </div>
</template>

<script setup>
const userStore = useUserStore()
const pendingReconnect = ref(false)

async function reconnect() {
    pendingReconnect.value = true
    try {
        await userStore.logout()
        userStore.profileError = null
        await navigateTo('/login')
    }
    catch (error) {
        userStore.profileError = authErrorMessage(error)
    }
    finally {
        pendingReconnect.value = false
    }
}
</script>

<style lang="postcss" scoped>

</style>