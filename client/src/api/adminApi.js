import { axiosClient } from './axiosClient'
import { withFallback } from './fallback'
import { mockAdminUsers, mockReports } from '@/utils/mockData'

export const adminApi = {
  getStats() {
    return withFallback(() => axiosClient.get('/admin/stats'), {
      totalUsers: 2480,
      activeListings: 812,
      reportsOpen: 16,
      ordersToday: 31,
    }, { dedupeKey: 'admin:stats' })
  },
  getReports() {
    return withFallback(() => axiosClient.get('/admin/reports'), { items: mockReports }, { dedupeKey: 'admin:reports' })
  },
  getUsers() {
    return withFallback(() => axiosClient.get('/admin/users'), { items: mockAdminUsers }, { dedupeKey: 'admin:users' })
  },
  suspendUser(userId) {
    return withFallback(() => axiosClient.post(`/admin/users/${userId}/suspend`), { success: true })
  },
  deleteUser(userId) {
    return withFallback(() => axiosClient.delete(`/admin/users/${userId}`), { success: true })
  },
  updateReportStatus(reportId, status) {
    return withFallback(() => axiosClient.patch(`/admin/reports/${reportId}`, { status }), {
      success: true,
      id: reportId,
      status,
    })
  },
}
