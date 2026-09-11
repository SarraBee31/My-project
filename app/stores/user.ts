import type { Database } from '~/types/database.types'

export type AestheticId =
  | 'quiet-luxury'
  | 'parisian'
  | 'minimal'
  | 'coastal'
  | 'old-money'
  | 'vintage'

export const aestheticOptions: { id: AestheticId, label: string, description: string }[] = [
  { id: 'quiet-luxury', label: 'Quiet luxury', description: 'Neutres, coupes nettes, matières nobles.' },
  { id: 'parisian', label: 'Parisian chic', description: 'Marinière, trench, noir et beige.' },
  { id: 'minimal', label: 'Minimal', description: 'Peu de pièces, silhouettes droites.' },
  { id: 'coastal', label: 'Coastal', description: 'Lin, blanc cassé, bleu pâle.' },
  { id: 'old-money', label: 'Old money', description: 'Blazers, cachemire, classiques.' },
  { id: 'vintage', label: 'Vintage', description: 'Pièces trouvées, textures, caractère.' },
]

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export function usernameFromNames(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim()
}

function namesFromUsername(username: string | null | undefined) {
  const trimmed = username?.trim() ?? ''
  if (!trimmed) return { firstName: '', lastName: '' }
  const [firstName, ...rest] = trimmed.split(/\s+/)
  return {
    firstName,
    lastName: rest.join(' '),
  }
}

function emptyProfile() {
  return {
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
    postalAddress: '',
    aestheticId: null as AestheticId | null,
    isRegistered: false,
    isLoggedIn: false,
    profileError: null as string | null,
  }
}

export const useUserStore = defineStore('user', {
  state: () => emptyProfile(),
  getters: {
    aestheticLabel: (state) => {
      return aestheticOptions.find(option => option.id === state.aestheticId)?.label ?? null
    },
  },
  actions: {
    reset() {
      Object.assign(this, emptyProfile())
    },
    applyProfile(row: Partial<ProfileRow> | null, email?: string | null) {
      const names = namesFromUsername(row?.username)
      this.firstName = names.firstName || this.firstName
      this.lastName = names.lastName || this.lastName
      if (row?.aesthetic_id) this.aestheticId = row.aesthetic_id as AestheticId
      if (email) this.email = email
      this.isRegistered = true
      this.isLoggedIn = true
    },
    async syncFromSupabase(authUser?: { id?: string, sub?: string, email?: string, user_metadata?: Record<string, string> } | null) {
      const client = useSupabaseClient<Database>()
      const user = await resolveAuthUser(authUser)
      const userId = supabaseUserId(user)

      if (!userId) {
        this.reset()
        return
      }

      this.email = user?.email ?? ''
      this.isLoggedIn = true
      this.isRegistered = true

      const metadata = user?.user_metadata ?? {}

      async function loadProfile() {
        return client
          .from('profiles')
          .select('id, username, aesthetic_id')
          .eq('id', userId)
          .maybeSingle()
      }

      let { data, error } = await loadProfile()
      if (error) throw error

      if (!data) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const retry = await loadProfile()
        if (retry.error) throw retry.error
        data = retry.data
      }

      if (!data) {
        throw new Error('Profil introuvable. Réessaie dans un instant.')
      }

      this.profileError = null
      this.applyProfile(data, user?.email)
      this.phone = metadata.phone ?? this.phone
      this.postalAddress = metadata.postal_address ?? metadata.postalAddress ?? this.postalAddress
      if (!this.firstName) {
        this.firstName = metadata.first_name ?? metadata.firstName ?? ''
        this.lastName = metadata.last_name ?? metadata.lastName ?? ''
      }
    },
    async setAesthetic(id: AestheticId) {
      const client = useSupabaseClient<Database>()
      const user = await resolveAuthUser()
      const userId = supabaseUserId(user)
      if (!userId) throw new Error('Tu dois être connectée pour enregistrer ton aesthetic.')

      const { data, error } = await client
        .from('profiles')
        .update({ aesthetic_id: id })
        .eq('id', userId)
        .select('id')
        .maybeSingle()
      if (error) throw error

      if (!data) {
        await this.syncFromSupabase()
        const { error: retryError } = await client
          .from('profiles')
          .update({ aesthetic_id: id })
          .eq('id', userId)
        if (retryError) throw retryError
      }

      this.aestheticId = id
    },
    async logout() {
      const client = useSupabaseClient<Database>()
      const { error } = await client.auth.signOut()
      this.reset()
      if (error) throw error
    },
  },
  persist: {
    pick: ['lastName', 'firstName', 'email', 'phone', 'postalAddress', 'aestheticId'],
  },
})
