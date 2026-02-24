import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { messagingApi } from '@/api/messagingApi'
import { useAuth } from '@/context/AuthContext'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConversationList } from '@/components/messaging/ConversationList'
import { ChatWindow } from '@/components/messaging/ChatWindow'

function MessagingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const targetConversationId = location.state?.conversationId || ''

  useEffect(() => {
    let isMounted = true

    async function bootstrapMessaging() {
      setIsLoading(true)
      setError('')
      try {
        const conversationData = await messagingApi.getConversations(currentUser?.id)
        const items = (conversationData?.items || []).filter(
          (conversation) => conversation.participantId !== currentUser?.id,
        )
        if (!isMounted) return

        setConversations(items)

        if (!items.length) {
          setActiveConversationId('')
          setMessages([])
          return
        }

        const requestedId =
          targetConversationId && items.some((conversation) => conversation.id === targetConversationId)
            ? targetConversationId
            : items[0].id

        setActiveConversationId(requestedId)
        const messageData = await messagingApi.getMessages(requestedId, currentUser?.id)
        if (!isMounted) return

        setMessages(messageData?.items || [])

        if (targetConversationId) {
          navigate('/messages', { replace: true, state: null })
        }
      } catch {
        if (!isMounted) return
        setError('Unable to load messages right now')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    bootstrapMessaging()

    return () => {
      isMounted = false
    }
  }, [currentUser?.id, targetConversationId, navigate])

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [conversations, activeConversationId],
  )

  const selectConversation = async (conversationId) => {
    setActiveConversationId(conversationId)
    const data = await messagingApi.getMessages(conversationId, currentUser?.id)
    setMessages(data?.items || [])
  }

  const sendMessage = async (message) => {
    if (!activeConversationId) return

    const response = await messagingApi.sendMessage(activeConversationId, {
      message,
      participantId: activeConversation?.participantId,
      participantName: activeConversation?.name,
    }, currentUser?.id)
    const sentMessage = response?.item
    if (!sentMessage) return

    setMessages((previous) => [...previous, sentMessage])
    setConversations((previous) => {
      const next = previous.map((conversation) =>
        conversation.id === activeConversationId
          ? { ...conversation, lastMessage: sentMessage.message, updatedAt: sentMessage.createdAt }
          : conversation,
      )
      return [...next].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    })
  }

  if (isLoading) {
    return <Skeleton className="h-[70vh] w-full" />
  }

  if (error) {
    return <ErrorState title="Messaging unavailable" description={error} />
  }

  if (!conversations.length) {
    return (
      <EmptyState
        title="No conversations yet"
        description="Start chatting with a seller from any listing."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={selectConversation}
      />
      <ChatWindow
        messages={messages}
        participantName={activeConversation?.name}
        onSend={sendMessage}
      />
    </div>
  )
}

export default MessagingPage
