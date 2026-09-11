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
        Choisis une catégorie, puis ajoute ou supprime tes photos. JPG, PNG ou WEBP, 8 Mo max.
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

      <div class="mt-6 space-y-1.5">
        <label for="item-category" class="text-sm font-medium">Catégorie</label>
        <select
          id="item-category"
          v-model="category"
          class="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
          :disabled="pending"
        >
          <option value="" disabled>Choisis top, bottom ou shoes</option>
          <option value="top">top</option>
          <option value="bottom">bottom</option>
          <option value="shoes">shoes</option>
        </select>
      </div>

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
          :key="item.item_id"
          class="relative overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-700"
        >
          <img :src="item.photo_url" :alt="item.category" class="h-40 w-full object-cover">
          <figcaption class="space-y-2 px-2 py-2">
            <p class="text-xs text-muted-foreground">{{ item.category }}</p>
            <button
              type="button"
              class="text-xs text-destructive underline-offset-2 hover:underline"
              :disabled="pending"
              @click="onDelete(item.item_id)"
            >
              {{ deletingId === item.item_id ? 'Suppression…' : 'Supprimer' }}
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
const ALLOWED_CATEGORIES = ['top', 'bottom', 'shoes']

const userStore = useUserStore()
const pieceStore = usePieceStore()
const uploadError = ref(null)
const infoMessage = ref(null)
const category = ref('')
const deletingId = ref(null)
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

  if (!ALLOWED_CATEGORIES.includes(category.value)) {
    uploadError.value = 'Choisis une catégorie : top, bottom ou shoes.'
    return
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      uploadError.value = `${file.name} n’est pas une image JPG, PNG ou WEBP.`
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      uploadError.value = `${file.name} dépasse la limite de 8 Mo.`
      return
    }
  }

  pieceStore.saving = true
  try {
    for (const file of files) {
      await pieceStore.createFromFile(file, category.value)
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

async function onDelete(itemId) {
  uploadError.value = null
  deletingId.value = itemId
  pieceStore.saving = true
  try {
    await pieceStore.remove(itemId)
    infoMessage.value = 'Pièce supprimée.'
  }
  catch (error) {
    uploadError.value = authErrorMessage(error)
  }
  finally {
    pieceStore.saving = false
    deletingId.value = null
  }
}
</script>
