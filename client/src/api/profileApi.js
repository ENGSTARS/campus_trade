import { axiosClient } from './axiosClient'
import { withFallback } from './fallback'
import { mockProfile, mockTransactions } from '@/utils/mockData'

export const profileApi = {
  getProfile() {
    return withFallback(() => axiosClient.get('/profile'), { user: mockProfile }, { dedupeKey: 'profile:get' })
  },
  updateProfile(payload) {
    return withFallback(() => axiosClient.put('/profile', payload), {
      user: { ...mockProfile, ...payload },
    })
  },
  getTransactions() {
    return withFallback(() => axiosClient.get('/profile/transactions'), {
      items: mockTransactions,
    }, { dedupeKey: 'profile:transactions' })
  },
}
