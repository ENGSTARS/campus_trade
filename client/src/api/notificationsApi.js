import { axiosClient } from './axiosClient'

export const notificationsApi = {
  getNotifications() {
    return axiosClient.get('/notifications').then((response) => response?.data ?? response)
  },
  markAsRead(id) {
    return axiosClient.patch(`/notifications/${id}/read`).then((response) => response?.data ?? response)
  },
  markAllRead() {
    return axiosClient.patch('/notifications/read-all').then((response) => response?.data ?? response)
  },
}
