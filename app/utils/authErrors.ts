export function authErrorMessage(error: unknown) {
  const raw = error && typeof error === 'object' && 'message' in error
    ? String((error as { message: string }).message)
    : String(error || '')
  const message = raw.toLowerCase()

  if (message.includes('already registered') || message.includes('user already registered')) {
    return 'Un compte existe déjà avec cet email. Connecte-toi, ou confirme d’abord ton email.'
  }
  if (message.includes('email not confirmed')) {
    return 'Confirme d’abord ton email. Vérifie ta boîte de réception et les spams.'
  }
  if (message.includes('invalid login') || message.includes('invalid credentials')) {
    return 'Email ou mot de passe incorrect.'
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Trop de tentatives. Réessaie dans quelques minutes.'
  }
  if (message.includes('signup is disabled')) {
    return 'Les inscriptions sont désactivées sur Supabase.'
  }
  if (message.includes('error sending confirmation email') || message.includes('error sending')) {
    return 'Le compte a peut-être été créé, mais l’email de confirmation n’a pas pu partir.'
  }
  if (message.includes('could not find the table') || message.includes('does not exist')) {
    return 'Une table Supabase est introuvable (profile ou piece). Exécute supabase/schema.sql.'
  }
  if (message.includes('bucket not found') || (message.includes('bucket') && message.includes('not found'))) {
    return 'Le bucket Storage « pieces » est introuvable. Crée-le dans Supabase (voir docs/database.md).'
  }
  if (message.includes('row-level security') || message.includes('permission denied') || message.includes('42501')) {
    return 'Accès refusé par RLS. Vérifie les politiques SQL (docs/database.md).'
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Impossible de joindre Supabase. Vérifie ta connexion.'
  }

  return raw || 'Une étape a échoué. Réessaie.'
}
