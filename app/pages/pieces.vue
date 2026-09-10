<template>
  <div class="flex min-h-[calc(100vh-8.3rem)] flex-col py-8">
    <div class="mx-auto w-full max-w-3xl">
      <p class="text-sm text-muted-foreground">
        {{ userStore.firstName || 'Salut' }}
        <template v-if="userStore.aestheticLabel">
          · capsule {{ userStore.aestheticLabel }}
        </template>
      </p>
      <h1 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
        Upload your pieces
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">
        Ajoute, renomme ou supprime tes photos. JPG, PNG ou WEBP, 8 Mo max. Elles sont enregistrées dans Supabase.
      </p>

      <p v-if="pieceStore.loading" class="mt-3 text-sm text-muted-foreground" role="status">
        Chargement de tes pièces…
      </p>
      <p v-if="uploadError" class="mt-3 text-sm text-destructive" role="alert">
        {{ uploadError }}
      </p>
      <p v-if="infoMessage" class="mt-3 text-sm text-muted-foreground" role="status">
        {{ infoMessage }}
      </p>

      <label
        class="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center dark:border-stone-600 dark:bg-stone-900"
        :class="pending ? 'pointer-events-none opacity-60' : ''"
      >
        <span class="text-sm font-medium">{{ pending ? 'Envoi…' : 'Choisir des photos' }}</span>
        <span class="mt-1 text-xs text-muted-foreground">Création en base dès l’ajout</span>
        <input
          class="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          :disabled="pending"
          @change="onFilesSelected"
        >
      </label>

      <div v-if="pieceStore.items.length" class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <figure
          v-for="item in pieceStore.items"
          :key="item.id"
          class="relative overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-700"
        >
          <img :src="item.imageUrl" :alt="item.name" class="h-40 w-full object-cover">
          <figcaption class="space-y-2 px-2 py-2">
            <input
              :value="item.name"
              class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              aria-label="Nom de la pièce"
              @change="onRename(item.id, $event)"
            >
            <button
              type="button"
              class="text-xs text-destructive underline-offset-2 hover:underline"
              :disabled="pending"
              @click="onDelete(item.id)"
            >
              Supprimer
            </button>
          </figcaption>
        </figure>
      </div>
      <p v-else-if="!pieceStore.loading" class="mt-6 text-sm text-muted-foreground">
        Aucune pièce enregistrée pour l’instant.
      </p>

      <Button as-child variant="outline" class="mt-6 h-11 w-full rounded-full sm:w-auto sm:px-8">
        <NuxtLink to="/aesthetic">Modifier mon aesthetic</NuxtLink>
      </Button>
    </div>
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({ title: 'Upload your pieces' })

const MAX_FILE_SIZE = 8 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const userStore = useUserStore()
const pieceStore = usePieceStore()
const uploadError = ref(null)
const infoMessage = ref(null)
const pending = computed(() => pieceStore.saving || pieceStore.loading)

onMounted(async () => {
  try {
    await pieceStore.fetchAll()
  }
  catch (error) {
    uploadError.value = authErrorMessage(error)
  }
})

async function onFilesSelected(event) {
  uploadError.value = null
  infoMessage.value = null
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  pieceStore.saving = true

  try {
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`${file.name} n’est pas une image JPG, PNG ou WEBP.`)
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`${file.name} dépasse 8 Mo.`)
      }
      await pieceStore.createFromFile(file)
    }
    infoMessage.value = files.length === 1
      ? 'Pièce enregistrée dans Supabase.'
      : `${files.length} pièces enregistrées dans Supabase.`
  }
  catch (error) {
    uploadError.value = authErrorMessage(error)
  }
  finally {
    pieceStore.saving = false
  }
}

async function onRename(id, event) {
  uploadError.value = null
  try {
    await pieceStore.rename(id, event.target.value)
    infoMessage.value = 'Nom mis à jour.'
  }
  catch (error) {
    uploadError.value = authErrorMessage(error)
  }
}

async function onDelete(id) {
  uploadError.value = null
  pieceStore.saving = true
  try {
    await pieceStore.remove(id)
    infoMessage.value = 'Pièce supprimée.'
  }
  catch (error) {
    uploadError.value = authErrorMessage(error)
  }
  finally {
    pieceStore.saving = false
  }
}
</script>
