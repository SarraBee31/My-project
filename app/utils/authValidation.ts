const NAME_PATTERN = /^[A-Za-zÀ-ÿ' -]{2,40}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_PATTERN = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/
const POSTAL_CODE_PATTERN = /\b\d{5}\b/

export type FieldError = string | null

function emptyMessage(label: string) {
  return `${label} est obligatoire.`
}

export function validateLastName(value: string): FieldError {
  const trimmed = value.trim()
  if (!trimmed) return emptyMessage('Le nom')
  if (!NAME_PATTERN.test(trimmed)) return 'Le nom doit contenir au moins 2 lettres (sans chiffres).'
  return null
}

export function validateFirstName(value: string): FieldError {
  const trimmed = value.trim()
  if (!trimmed) return emptyMessage('Le prénom')
  if (!NAME_PATTERN.test(trimmed)) return 'Le prénom doit contenir au moins 2 lettres (sans chiffres).'
  return null
}

export function validateEmail(value: string): FieldError {
  const trimmed = value.trim()
  if (!trimmed) return emptyMessage('L’email')
  if (!EMAIL_PATTERN.test(trimmed)) return 'Entre une adresse email valide, comme prenom@mail.fr.'
  return null
}

export function validatePhone(value: string): FieldError {
  const trimmed = value.trim()
  if (!trimmed) return emptyMessage('Le numéro')
  if (!PHONE_PATTERN.test(trimmed)) return 'Entre un numéro français valide, comme 06 12 34 56 78.'
  return null
}

export function validatePostalAddress(value: string): FieldError {
  const trimmed = value.trim()
  if (!trimmed) return emptyMessage('L’adresse postale')
  if (trimmed.length < 10) return 'L’adresse est trop courte. Ajoute rue, code postal et ville.'
  if (!POSTAL_CODE_PATTERN.test(trimmed)) return 'L’adresse doit contenir un code postal à 5 chiffres.'
  return null
}

export function validatePassword(value: string): FieldError {
  if (!value) return emptyMessage('Le mot de passe')
  if (value.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.'
  return null
}
