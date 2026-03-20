// client/src/api/profileApi.js

import { axiosClient } from './axiosClient'
import { withFallback } from './fallback'
import { mockProfile, mockTransactions } from '@/utils/mockData'

export const profileApi = {
  getProfile() {
    return withFallback(() => axiosClient.get('/me/'), { user: mockProfile }, { dedupeKey: 'profile:get' })
  },
  updateProfile(payload) {
    return withFallback(() => axiosClient.put('/me/', payload), {
      user: { ...mockProfile, ...payload },
    })
  },
  getTransactions() {
    return withFallback(() => axiosClient.get('/me/transactions/'), {
      items: mockTransactions,
    }, { dedupeKey: 'profile:transactions' })
  },
  getPublicProfile(userId) {
    return withFallback(() => axiosClient.get(`/users/${userId}/`), { user: mockProfile })
  },
  getAdminUserProfile(userId) {
    return withFallback(() => axiosClient.get(`/admin/users/${userId}/detail/`), {
      user: {
        ...mockProfile,
        id: userId,
        accountStatus: 'Active',
        activeListings: 0,
        inventoryUnits: 0,
        soldOutListings: 0,
      },
    })
  }
}
