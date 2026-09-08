<template>
    <div class="default-layout mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4">
        <the-navbar />
        <div class="flex-auto">
            <slot />
        </div>
        <the-footer />
    </div>
</template>

<script setup>

</script>

<style lang="postcss" scoped>

</style>