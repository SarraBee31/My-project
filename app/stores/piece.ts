import { defineStore } from 'pinia'
import type { Database } from '~/types/database.types'

type ItemRow = Database['public']['Tables']['items']['Row']
type ItemCategory = Database['public']['Enums']['item_category']

export type PieceItem = ItemRow

const BUCKET = 'photos'

function extFromFile(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && ['jpg', 'jpeg', 'png', 'webp'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName
  }
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

function storagePathFromPublicUrl(photoUrl: string) {
  const marker = `/object/public/${BUCKET}/`
  const index = photoUrl.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(photoUrl.slice(index + marker.length))
}

function rethrowItemError(error: { code?: string, message?: string, details?: string, hint?: string }) {
  const code = error.code ?? ''
  const message = error.message ?? String(error)
  const blob = [code, message, error.details, error.hint].filter(Boolean).join(' ').toLowerCase()
  if (code === '23503' && blob.includes('outfit_items')) {
    throw new Error('Cette pièce est utilisée dans un outfit')
  }
  if (code === '23503' && blob.includes('items_user_id_fkey')) {
    throw new Error('Profil introuvable — reconnecte-toi.')
  }
  throw new Error(`Erreur ${code || '?'} : ${message}`)
}

export const usePieceStore = defineStore('piece', {
  state: () => ({
    items: [] as PieceItem[],
    loading: false,
    saving: false,
    error: null as string | null,
  }),
  actions: {
    async fetchAll() {
      const client = useSupabaseClient<Database>()
      const user = await resolveAuthUser()
      const userId = supabaseUserId(user)
      if (!userId) {
        this.items = []
        return
      }

      this.loading = true
      this.error = null
      try {
        const { data, error } = await client
          .from('items')
          .select('item_id, user_id, photo_url, category, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (error) throw error
        this.items = data ?? []
      }
      catch (error) {
        this.error = authErrorMessage(error)
        throw error
      }
      finally {
        this.loading = false
      }
    },
    async createFromFile(file: File, category: ItemCategory) {
      const client = useSupabaseClient<Database>()
      const user = await resolveAuthUser()
      const userId = supabaseUserId(user)
      if (!userId) throw new Error('Tu dois être connectée pour ajouter une pièce.')

      const filename = `${crypto.randomUUID()}.${extFromFile(file)}`
      const path = `${userId}/${filename}`
      const { error: uploadError } = await client.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        contentType: file.type,
      })
      if (uploadError) throw uploadError

      const photoUrl = client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

      const { data, error } = await client
        .from('items')
        .insert({
          user_id: userId,
          photo_url: photoUrl,
          category,
        })
        .select('item_id, user_id, photo_url, category, created_at')
        .single()
      if (error) rethrowItemError(error)

      this.items.unshift(data)
    },
    async remove(itemId: string) {
      const client = useSupabaseClient<Database>()
      const item = this.items.find(row => row.item_id === itemId)
      if (!item) return

      const { error } = await client.from('items').delete().eq('item_id', itemId)
      if (error) rethrowItemError(error)

      this.items = this.items.filter(row => row.item_id !== itemId)

      const storagePath = storagePathFromPublicUrl(item.photo_url)
      if (storagePath) {
        const { error: storageError } = await client.storage.from(BUCKET).remove([storagePath])
        if (storageError) {
          throw new Error("Pièce supprimée, mais le fichier n'a pas pu être nettoyé")
        }
      }
    },
  },
})
