/** Persisted in localStorage so refresh keeps the same handles. */
export const HANDLES_STORAGE_KEY = 'osint-guard-handles'

/** Session flags: landing submit forces new Apify + Gemini (skip DB restore for that step). */
export const SS_FORCE_COLLECT = 'osint-guard-force-collect'
export const SS_SKIP_AI_RESTORE = 'osint-guard-skip-ai-restore'

function norm(s: string) {
  return s.replace(/^@+/g, '').trim().toLowerCase()
}

export type HandlesLike = {
  linkedin: string
  instagram: string
  twitter: string
}

export function handlesMatchSnapshot(h: HandlesLike, row: HandlesLike): boolean {
  return (
    norm(h.linkedin) === norm(row.linkedin) &&
    norm(h.instagram) === norm(row.instagram) &&
    norm(h.twitter) === norm(row.twitter)
  )
}

export function markFreshRunFromLanding() {
  try {
    sessionStorage.setItem(SS_FORCE_COLLECT, '1')
    sessionStorage.setItem(SS_SKIP_AI_RESTORE, '1')
  } catch {
    /* private mode */
  }
}

export function consumeForceCollect(): boolean {
  try {
    if (sessionStorage.getItem(SS_FORCE_COLLECT) !== '1') return false
    sessionStorage.removeItem(SS_FORCE_COLLECT)
    return true
  } catch {
    return false
  }
}

export function consumeSkipAiRestore(): boolean {
  try {
    if (sessionStorage.getItem(SS_SKIP_AI_RESTORE) !== '1') return false
    sessionStorage.removeItem(SS_SKIP_AI_RESTORE)
    return true
  } catch {
    return false
  }
}
