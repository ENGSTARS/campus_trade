const inflightRequests = new Map()

const DEFAULT_FALLBACK_DELAY = Number(
  import.meta.env.VITE_FALLBACK_DELAY_MS ?? (import.meta.env.DEV ? 40 : 120),
)

// Errors that should always surface to the UI — never mask with mock data
const ALWAYS_RETHROW_STATUSES = new Set([401, 403, 404, 422, 429])

export async function withFallback(apiCall, fallbackData, options = {}) {
  const { delay = DEFAULT_FALLBACK_DELAY, dedupeKey } = options

  // Return in-flight promise if same request is already running
  if (dedupeKey && inflightRequests.has(dedupeKey)) {
    return inflightRequests.get(dedupeKey)
  }

  const task = (async () => {
    try {
      const response = await apiCall()
      return response?.data ?? response

    } catch (error) {
      const status = error?.response?.status

      // Always re-throw HTTP errors — only fall back on network failures
      if (ALWAYS_RETHROW_STATUSES.has(status)) throw error
      if (status >= 500) throw error
      if (error?.response) throw error  // any other HTTP response

      // Never serve mock data in production
      if (!import.meta.env.DEV) throw error

      // Dev only — warn and return mock data for network failures
      if (import.meta.env.DEV) {
        console.warn(
          `[fallback] Network unreachable${dedupeKey ? ` → ${dedupeKey}` : ''} — using mock data`,
          `(${error?.message})`,
        )
      }

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
// ```

// ---

// ## How It Now Behaves With Your Django Backend
// ```
// Scenario                          Before fix          After fix
// ──────────────────────────────────────────────────────────────────
// Backend running, request OK       ✅ real data        ✅ real data
// Backend down / no network         ✅ mock data        ✅ mock data (dev only)
// Django returns 401 expired JWT    ❌ mock data        ✅ throws → axiosClient
//                                                          refresh interceptor fires
// Django returns 403 forbidden      ❌ mock data        ✅ throws → UI shows error
// Django returns 422 bad payload    ❌ mock data        ✅ throws → form shows errors
// Django returns 500 server crash   ❌ mock data        ✅ throws → error boundary
// Production build, backend down    ❌ mock data leak   ✅ throws → error page