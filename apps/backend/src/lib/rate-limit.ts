// Limiteur à fenêtre fixe, en mémoire. SUFFISANT pour 1 instance ; avec 2 instances server
// ou plus, remplacer le store par Redis (INCR + EXPIRE) – voir docs/ARCHITECTURE.md §9.
export type Limiter = (key: string, now?: number) => { allowed: boolean; retryAfterSec: number }

export function createLimiter(max: number, windowMs: number): Limiter {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return (key, now = Date.now()) => {
    const cur = hits.get(key)
    if (!cur || cur.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      return { allowed: true, retryAfterSec: 0 }
    }
    cur.count += 1
    if (cur.count > max) return { allowed: false, retryAfterSec: Math.ceil((cur.resetAt - now) / 1000) }
    return { allowed: true, retryAfterSec: 0 }
  }
}
