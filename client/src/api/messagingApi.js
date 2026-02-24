import { axiosClient } from './axiosClient'
import { mockConversations, mockMessages } from '@/utils/mockData'

const CONVERSATIONS_STORAGE_KEY = 'campustrade-local-conversations'
const MESSAGES_STORAGE_KEY = 'campustrade-local-messages'

function getConversationsStorageKey(userId) {
  return `${CONVERSATIONS_STORAGE_KEY}:${userId || 'guest'}`
}

function getMessagesStorageKey(userId) {
  return `${MESSAGES_STORAGE_KEY}:${userId || 'guest'}`
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
    const createdAt = new Date().toISOString()
    const nextMessage = {
      id: `m-local-${Date.now()}`,
      fromMe: payload.fromMe ?? true,
      message: payload.message,
      createdAt,
    }

    const localMessages = readLocalMessages(userId)
    const currentMessages = localMessages[conversationId] || []
    localMessages[conversationId] = [...currentMessages, nextMessage]
    writeLocalMessages(userId, localMessages)

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

    try {
      await axiosClient.post(`/messaging/conversations/${conversationId}`, payload)
    } catch {
      // Keep local persistence if API is unavailable.
    }

    return {
      success: true,
      item: nextMessage,
    }
  },
  async upsertConversation(payload, userId) {
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
    return nextConversation
  },
}
