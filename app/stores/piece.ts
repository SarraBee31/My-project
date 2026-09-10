import type { Database } from '~/types/database.types'

type PieceRow = Database['public']['Tables']['piece']['Row']

export type PieceItem = PieceRow & {
  imageUrl: string
}

const BUCKET = 'pieces'

function extFromFile(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && ['jpg', 'jpeg', 'png', 'webp'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName
  }
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

export const usePieceStore = defineStore('piece', {
  state: () => ({
    items: [] as PieceItem[],
    loading: false,
    saving: false,
    error: null as string | null,
  }),
  actions: {
    imageUrl(storagePath: string) {
      const client = useSupabaseClient<Database>()
      return client.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
    },
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
          .from('piece')
          .select('id, user_id, name, storage_path, created_at, updated_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (error) throw error
        this.items = (data ?? []).map(row => ({
          ...row,
          imageUrl: this.imageUrl(row.storage_path),
        }))
      }
      catch (error) {
        this.error = authErrorMessage(error)
        throw error
      }
      finally {
        this.loading = false
      }
    },
    async createFromFile(file: File) {
      const client = useSupabaseClient<Database>()
      const user = await resolveAuthUser()
      const userId = supabaseUserId(user)
      if (!userId) throw new Error('Tu dois être connectée pour ajouter une pièce.')

      const path = `${userId}/${crypto.randomUUID()}.${extFromFile(file)}`
      const { error: uploadError } = await client.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        contentType: file.type,
      })
      if (uploadError) throw uploadError

      const { data, error } = await client
        .from('piece')
        .insert({
          user_id: userId,
          name: file.name.replace(/\.[^.]+$/, '') || 'Pièce',
          storage_path: path,
        })
        .select('id, user_id, name, storage_path, created_at, updated_at')
        .single()
      if (error) throw error

      this.items.unshift({
        ...data,
        imageUrl: this.imageUrl(data.storage_path),
      })
    },
    async rename(id: string, name: string) {
      const client = useSupabaseClient<Database>()
      const trimmed = name.trim()
      if (!trimmed) throw new Error('Le nom de la pièce est obligatoire.')

      const { data, error } = await client
        .from('piece')
        .update({ name: trimmed, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, user_id, name, storage_path, created_at, updated_at')
        .single()
      if (error) throw error

      this.items = this.items.map(item => item.id === id
        ? { ...data, imageUrl: this.imageUrl(data.storage_path) }
        : item)
    },
    async remove(id: string) {
      const client = useSupabaseClient<Database>()
      const item = this.items.find(piece => piece.id === id)
      if (!item) return

      const { error: storageError } = await client.storage.from(BUCKET).remove([item.storage_path])
      if (storageError) throw storageError

      const { error } = await client.from('piece').delete().eq('id', id)
      if (error) throw error

      this.items = this.items.filter(piece => piece.id !== id)
    },
  },
})
