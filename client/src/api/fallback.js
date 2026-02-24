const inflightRequests = new Map()

const DEFAULT_FALLBACK_DELAY = Number(
  import.meta.env.VITE_FALLBACK_DELAY_MS ?? (import.meta.env.DEV ? 40 : 120),
)

export async function withFallback(apiCall, fallbackData, options = {}) {
  const { delay = DEFAULT_FALLBACK_DELAY, dedupeKey } = options

  if (dedupeKey && inflightRequests.has(dedupeKey)) {
    return inflightRequests.get(dedupeKey)
  }

  const task = (async () => {
    try {
      const response = await apiCall()
      return response?.data ?? response
    } catch {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      return typeof fallbackData === 'function' ? fallbackData() : fallbackData
    } finally {
      if (dedupeKey) inflightRequests.delete(dedupeKey)
    }
  })()

  if (dedupeKey) inflightRequests.set(dedupeKey, task)
  return task
}
