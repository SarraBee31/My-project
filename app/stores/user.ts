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

type ProfileRow = {
  id: string
  username: string | null
  aesthetic_id: AestheticId | null
}

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
      this.aestheticId = row?.aesthetic_id ?? this.aestheticId
      if (email) this.email = email
      this.isRegistered = true
      this.isLoggedIn = true
    },
    async syncFromSupabase(authUser?: { id?: string, sub?: string, email?: string, user_metadata?: Record<string, string> } | null) {
      const client = useSupabaseClient()
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
      const fallbackUsername = usernameFromNames(
        metadata.first_name ?? metadata.firstName ?? this.firstName,
        metadata.last_name ?? metadata.lastName ?? this.lastName,
      ) || metadata.username || (user?.email ?? '')

      const { data, error } = await client
        .from('profile')
        .select('id, username, aesthetic_id')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        const { error: upsertError } = await client.from('profile').upsert({
          id: userId,
          username: fallbackUsername,
        })
        if (upsertError) throw upsertError

        const { data: created, error: reloadError } = await client
          .from('profile')
          .select('id, username, aesthetic_id')
          .eq('id', userId)
          .maybeSingle()
        if (reloadError) throw reloadError
        this.applyProfile(created, user?.email)
      }
      else {
        this.applyProfile(data, user?.email)
      }

      this.phone = metadata.phone ?? this.phone
      this.postalAddress = metadata.postal_address ?? metadata.postalAddress ?? this.postalAddress
      if (!this.firstName) {
        this.firstName = metadata.first_name ?? metadata.firstName ?? ''
        this.lastName = metadata.last_name ?? metadata.lastName ?? ''
      }
    },
    async saveProfile(payload: {
      lastName: string
      firstName: string
      phone: string
      postalAddress: string
    }, authUser?: { id?: string, sub?: string, email?: string } | null) {
      const client = useSupabaseClient()
      const user = await resolveAuthUser(authUser)
      const userId = supabaseUserId(user)
      if (!userId) throw new Error('Tu dois être connectée pour enregistrer le profil.')

      const row = {
        id: userId,
        username: usernameFromNames(payload.firstName, payload.lastName),
      }

      const { error } = await client.from('profile').upsert(row)
      if (error) throw error
      this.phone = payload.phone.trim()
      this.postalAddress = payload.postalAddress.trim()
      this.applyProfile(row, user?.email)
    },
    async setAesthetic(id: AestheticId) {
      const client = useSupabaseClient()
      const user = await resolveAuthUser()
      const userId = supabaseUserId(user)
      if (!userId) throw new Error('Tu dois être connectée pour enregistrer ton aesthetic.')

      const { data, error } = await client
        .from('profile')
        .update({ aesthetic_id: id })
        .eq('id', userId)
        .select('id')
        .maybeSingle()
      if (error) throw error

      if (!data) {
        await this.syncFromSupabase()
        const { error: retryError } = await client
          .from('profile')
          .update({ aesthetic_id: id })
          .eq('id', userId)
        if (retryError) throw retryError
      }

      this.aestheticId = id
    },
    async logout() {
      const client = useSupabaseClient()
      const { error } = await client.auth.signOut()
      this.reset()
      if (error) throw error
    },
  },
  persist: {
    pick: ['lastName', 'firstName', 'email', 'phone', 'postalAddress', 'aestheticId'],
  },
})
