import { axiosClient } from './axiosClient'

export const adminApi = {
  getStats() {
    return axiosClient.get('/admin/stats/').then((response) => response?.data ?? response)
  },
  getReports() {
    return axiosClient.get('/admin/reports/').then((response) => response?.data ?? response)
  },
  getUsers() {
    return axiosClient.get('/admin/users/').then((response) => response?.data ?? response)
  },
  suspendUser(userId) {
    return axiosClient.post(`/admin/users/${userId}/suspend/`).then((response) => response?.data ?? response)
  },
  deleteUser(userId) {
    return axiosClient.delete(`/admin/users/${userId}/`).then((response) => response?.data ?? response)
  },
  updateReportStatus(reportId, status) {
    return axiosClient.patch(`/admin/reports/${reportId}/`, { status }).then((response) => response?.data ?? response)
  },
}
