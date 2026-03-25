// client/src/api/profileApi.js

import { axiosClient } from './axiosClient'

export const profileApi = {
  getProfile() {
    return axiosClient.get('/me/').then((response) => response?.data ?? response)
  },
  updateProfile(payload) {
    const normalizedPayload = {}

    if (typeof payload?.fullName === 'string') normalizedPayload.full_name = payload.fullName.trim()
    if (typeof payload?.bio === 'string') normalizedPayload.bio = payload.bio.trim()
    if (typeof payload?.campus === 'string') normalizedPayload.campus = payload.campus.trim()
    if (typeof payload?.contact === 'string') normalizedPayload.contact = payload.contact.trim()
    if (payload?.avatar !== undefined) normalizedPayload.avatar = payload.avatar

    return axiosClient.put('/me/', normalizedPayload).then((response) => response?.data ?? response)
  },
  getTransactions() {
    return axiosClient.get('/me/transactions/').then((response) => response?.data ?? response)
  },
  getPublicProfile(userId) {
    return axiosClient.get(`/users/${userId}/`).then((response) => response?.data ?? response)
  },
  getAdminUserProfile(userId) {
    return axiosClient.get(`/admin/users/${userId}/detail/`).then((response) => response?.data ?? response)
  },
}
