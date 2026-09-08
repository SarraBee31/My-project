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

export const useUserStore = defineStore('user', {
  state: () => ({
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
    postalAddress: '',
    password: '',
    aestheticId: null as AestheticId | null,
    isRegistered: false,
    isLoggedIn: false,
  }),
  getters: {
    aestheticLabel: (state) => {
      return aestheticOptions.find(option => option.id === state.aestheticId)?.label ?? null
    },
  },
  actions: {
    register(payload: {
      lastName: string
      firstName: string
      email: string
      phone: string
      postalAddress: string
      password: string
    }) {
      this.lastName = payload.lastName.trim()
      this.firstName = payload.firstName.trim()
      this.email = payload.email.trim().toLowerCase()
      this.phone = payload.phone.trim()
      this.postalAddress = payload.postalAddress.trim()
      this.password = payload.password
      this.isRegistered = true
      this.isLoggedIn = true
    },
    login(email: string, password: string) {
      if (!this.isRegistered) {
        return 'Aucun compte n’a encore été créé. Inscris-toi d’abord.'
      }
      if (this.email !== email.trim().toLowerCase()) {
        return 'Aucun compte ne correspond à cet email.'
      }
      if (this.password !== password) {
        return 'Le mot de passe est incorrect.'
      }
      this.isLoggedIn = true
      return null
    },
    setAesthetic(id: AestheticId) {
      this.aestheticId = id
    },
  },
  persist: true,
})
