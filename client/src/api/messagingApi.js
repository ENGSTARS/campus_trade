import { axiosClient } from './axiosClient'

const CONVERSATIONS_STORAGE_KEY = 'campustrade-local-conversations'
const MESSAGES_STORAGE_KEY = 'campustrade-local-messages'
const LEGACY_MESSAGING_PURGED_KEY = 'campustrade-local-messaging-purged-v1'

function purgeLegacyMessagingCache() {
  if (typeof window === 'undefined' || !window.localStorage) return
  if (localStorage.getItem(LEGACY_MESSAGING_PURGED_KEY) === '1') return

  const keysToRemove = []
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key) continue
    if (key.startsWith(`${CONVERSATIONS_STORAGE_KEY}:`) || key.startsWith(`${MESSAGES_STORAGE_KEY}:`)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key))
  localStorage.setItem(LEGACY_MESSAGING_PURGED_KEY, '1')
}

purgeLegacyMessagingCache()

export const messagingApi = {
  async getConversations() {
    const response = await axiosClient.get('/messaging/conversations')
    return response?.data ?? response
  },
  async getMessages(conversationId) {
    const response = await axiosClient.get(`/messaging/conversations/${conversationId}`)
    return response?.data ?? response
  },
  async sendMessage(conversationId, payload) {
    const response = await axiosClient.post(`/messaging/conversations/${conversationId}`, payload)
    return response?.data ?? response
  },
  async upsertConversation(payload) {
    const response = await axiosClient.post('/messaging/conversations', payload)
    return response?.data?.item || response?.item || null
  },
  async deleteConversation(conversationId) {
    const response = await axiosClient.delete(`/messaging/conversations/${conversationId}`)
    return response?.data ?? response
  },
}
