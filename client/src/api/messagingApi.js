import { axiosClient } from './axiosClient'
import { mockConversations, mockMessages } from '@/utils/mockData'

const CONVERSATIONS_STORAGE_KEY = 'campustrade-local-conversations'
const MESSAGES_STORAGE_KEY = 'campustrade-local-messages'
const LEGACY_MESSAGING_PURGED_KEY = 'campustrade-local-messaging-purged-v1'

function getConversationsStorageKey(userId) {
  return `${CONVERSATIONS_STORAGE_KEY}:${userId || 'guest'}`
}

function getMessagesStorageKey(userId) {
  return `${MESSAGES_STORAGE_KEY}:${userId || 'guest'}`
}

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

function readLocalConversations(userId) {
  const raw = localStorage.getItem(getConversationsStorageKey(userId))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalConversations(userId, conversations) {
  localStorage.setItem(getConversationsStorageKey(userId), JSON.stringify(conversations))
}

function readLocalMessages(userId) {
  const raw = localStorage.getItem(getMessagesStorageKey(userId))
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeLocalMessages(userId, messageMap) {
  localStorage.setItem(getMessagesStorageKey(userId), JSON.stringify(messageMap))
}

function sortByDateDesc(items) {
  return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

function sortByDateAsc(items) {
  return [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

function mergeConversations(baseConversations, localConversations) {
  const map = new Map()

  for (const conversation of baseConversations) {
    map.set(conversation.id, conversation)
  }

  for (const conversation of localConversations) {
    map.set(conversation.id, { ...map.get(conversation.id), ...conversation })
  }

  return sortByDateDesc(Array.from(map.values()))
}

function upsertLocalConversation(userId, nextConversation) {
  const localConversations = readLocalConversations(userId)
  const exists = localConversations.some((conversation) => conversation.id === nextConversation.id)
  const nextList = exists
    ? localConversations.map((conversation) =>
        conversation.id === nextConversation.id ? { ...conversation, ...nextConversation } : conversation,
      )
    : [nextConversation, ...localConversations]

  writeLocalConversations(userId, sortByDateDesc(nextList))
}

function appendLocalMessage(userId, conversationId, nextMessage) {
  const localMessages = readLocalMessages(userId)
  const currentMessages = localMessages[conversationId] || []
  localMessages[conversationId] = [...currentMessages, nextMessage]
  writeLocalMessages(userId, localMessages)
}

function removeLocalConversation(userId, conversationId) {
  const localConversations = readLocalConversations(userId).filter(
    (conversation) => conversation.id !== conversationId,
  )
  writeLocalConversations(userId, localConversations)

  const localMessages = readLocalMessages(userId)
  if (localMessages[conversationId]) {
    delete localMessages[conversationId]
    writeLocalMessages(userId, localMessages)
  }
}

purgeLegacyMessagingCache()

export const messagingApi = {
  async getConversations(userId) {
    let baseConversations = mockConversations
    try {
      const response = await axiosClient.get('/messaging/conversations')
      baseConversations = response?.data?.items || response?.items || []
    } catch {
      // Use local + mock data fallback.
    }

    const localConversations = readLocalConversations(userId)
    return {
      items: mergeConversations(baseConversations, localConversations),
    }
  },
  async getMessages(conversationId, userId) {
    let baseMessages = mockMessages[conversationId] || []
    try {
      const response = await axiosClient.get(`/messaging/conversations/${conversationId}`)
      baseMessages = response?.data?.items || response?.items || []
    } catch {
      // Use local + mock data fallback.
    }

    const localMessages = readLocalMessages(userId)
    const appendedMessages = localMessages[conversationId] || []
    return {
      items: sortByDateAsc([...baseMessages, ...appendedMessages]),
    }
  },
  async sendMessage(conversationId, payload, userId) {
    try {
      const response = await axiosClient.post(`/messaging/conversations/${conversationId}`, payload)
      return {
        success: true,
        item: response?.data?.item || response?.item || null,
      }
    } catch {
      // Fall back to local-only persistence if API is unavailable.
    }

    const createdAt = new Date().toISOString()
    const nextMessage = {
      id: `m-local-${Date.now()}`,
      fromMe: payload.fromMe ?? true,
      message: payload.message,
      createdAt,
    }
    const mirroredMessage = {
      ...nextMessage,
      fromMe: false,
    }

    appendLocalMessage(userId, conversationId, nextMessage)

    const existingConversation =
      mergeConversations(mockConversations, readLocalConversations(userId)).find(
        (conversation) => conversation.id === conversationId,
      ) || null

    const fallbackConversation = {
      id: conversationId,
      participantId: payload.participantId || '',
      name: payload.participantName || 'Conversation',
      unread: 0,
      lastMessage: payload.message,
      updatedAt: createdAt,
    }

    upsertLocalConversation(userId, {
      ...(existingConversation || fallbackConversation),
      lastMessage: payload.message,
      updatedAt: createdAt,
    })

    if (payload.participantId) {
      appendLocalMessage(payload.participantId, conversationId, mirroredMessage)
      upsertLocalConversation(payload.participantId, {
        id: conversationId,
        participantId: payload.senderId || userId,
        name: payload.senderName || 'Conversation',
        unread: 1,
        lastMessage: payload.message,
        updatedAt: createdAt,
        listingId: payload.listingId,
      })
    }

    return {
      success: true,
      item: nextMessage,
    }
  },
  async upsertConversation(payload, userId) {
    try {
      const response = await axiosClient.post('/messaging/conversations', payload)
      const item = response?.data?.item || response?.item || null
      if (item) return item
    } catch {
      // Fall back to local-only persistence if API is unavailable.
    }

    const allConversationsResponse = await this.getConversations(userId)
    const allConversations = allConversationsResponse?.items || []
    const existing = allConversations.find(
      (conversation) => conversation.participantId === payload.participantId,
    )

    if (existing) {
      const updated = {
        ...existing,
        name: payload.name || existing.name,
        participantId: payload.participantId || existing.participantId,
        listingId: payload.listingId || existing.listingId,
      }
      upsertLocalConversation(userId, updated)
      if (payload.participantId) {
        upsertLocalConversation(payload.participantId, {
          id: updated.id,
          participantId: payload.senderId || userId,
          name: payload.senderName || 'Conversation',
          unread: 0,
          lastMessage: updated.lastMessage || '',
          updatedAt: updated.updatedAt,
          listingId: updated.listingId,
        })
      }
      return updated
    }

    const nextConversation = {
      id: `c-local-${Date.now()}`,
      participantId: payload.participantId,
      name: payload.name || 'Seller',
      unread: 0,
      lastMessage: '',
      updatedAt: new Date().toISOString(),
      listingId: payload.listingId,
    }
    upsertLocalConversation(userId, nextConversation)
    if (payload.participantId) {
      upsertLocalConversation(payload.participantId, {
        id: nextConversation.id,
        participantId: payload.senderId || userId,
        name: payload.senderName || 'Conversation',
        unread: 0,
        lastMessage: '',
        updatedAt: nextConversation.updatedAt,
        listingId: payload.listingId,
      })
    }
    return nextConversation
  },
  async deleteConversation(conversationId, userId, participantId) {
    try {
      await axiosClient.delete(`/messaging/conversations/${conversationId}`)
    } catch {
      // Fall back to local-only cleanup if API is unavailable.
    }

    removeLocalConversation(userId, conversationId)
    if (participantId) {
      removeLocalConversation(participantId, conversationId)
    }
    return { success: true, id: conversationId }
  },
}
