import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { notificationsApi } from '@/api/notificationsApi'
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    async function loadNotifications() {
      const data = await notificationsApi.getNotifications()
      setNotifications(data?.items || [])
    }
    loadNotifications()
  }, [])

  const addNotification = (payload) => {
    const notification = {
      id: payload.id || `n-${Date.now()}`,
      title: payload.title,
      body: payload.body,
      createdAt: payload.createdAt || new Date().toISOString(),
      isRead: false,
    }
    setNotifications((previous) => [notification, ...previous])
    addToast({ type: 'info', message: notification.title })
  }

  useFirebaseNotifications(addNotification)

  const addToast = (payload) => {
    const toast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: payload.type || 'info',
      message: payload.message || 'Action completed',
    }
    setToasts((previous) => [toast, ...previous])
    setTimeout(() => {
      setToasts((previous) => previous.filter((item) => item.id !== toast.id))
    }, 3200)
  }

  const removeToast = (id) => {
    setToasts((previous) => previous.filter((item) => item.id !== id))
  }

  const markAsRead = async (id) => {
    await notificationsApi.markAsRead(id)
    setNotifications((previous) =>
      previous.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    )
  }

  const markAllRead = async () => {
    await notificationsApi.markAllRead()
    setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })))
  }

  const unreadCount = notifications.filter((item) => !item.isRead).length

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllRead,
      addNotification,
      toasts,
      addToast,
      removeToast,
    }),
    [notifications, unreadCount, toasts],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}
