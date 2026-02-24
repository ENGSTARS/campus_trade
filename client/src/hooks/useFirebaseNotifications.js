import { useEffect } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/utils/firebase'

export function useFirebaseNotifications(onNotification) {
  useEffect(() => {
    let unsubscribe = null

    async function setup() {
      try {
        const messaging = await getFirebaseMessaging()
        if (!messaging) return

        await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        }).catch(() => null)

        unsubscribe = onMessage(messaging, (payload) => {
          const title = payload?.notification?.title || 'CampusTrade'
          const body = payload?.notification?.body || 'New update received'
          onNotification?.({ title, body, isRead: false, createdAt: new Date().toISOString() })
        })
      } catch {
        // Firebase notifications are optional in local development.
      }
    }

    setup()
    return () => unsubscribe?.()
  }, [onNotification])
}
