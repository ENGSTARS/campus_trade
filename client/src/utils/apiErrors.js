export function extractApiErrorMessage(error, fallbackMessage = 'Something went wrong. Please try again.') {
  const data = error?.response?.data

  if (!data) return fallbackMessage
  if (typeof data === 'string') return data
  if (typeof data.detail === 'string') return data.detail
  if (typeof data.error === 'string') return data.error
  if (typeof data.message === 'string') return data.message
  if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) return data.non_field_errors[0]

  for (const value of Object.values(data)) {
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
    if (typeof value === 'string') return value
  }

  return fallbackMessage
}
