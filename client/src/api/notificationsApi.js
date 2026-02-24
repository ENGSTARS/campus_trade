import { axiosClient } from './axiosClient'
import { withFallback } from './fallback'
import { mockNotifications } from '@/utils/mockData'

export const notificationsApi = {
  getNotifications() {
    return withFallback(() => axiosClient.get('/notifications'), {
      items: mockNotifications,
    }, { dedupeKey: 'notifications:list' })
  },
  markAsRead(id) {
    return withFallback(() => axiosClient.patch(`/notifications/${id}/read`), {
      success: true,
    })
  },
  markAllRead() {
    return withFallback(() => axiosClient.patch('/notifications/read-all'), {
      success: true,
    })
  },
}
