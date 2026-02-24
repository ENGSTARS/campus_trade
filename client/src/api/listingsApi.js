import { axiosClient } from './axiosClient'
import { withFallback } from './fallback'
import { mockListings } from '@/utils/mockData'

export const listingsApi = {
  getListings(params = {}) {
    const key = JSON.stringify(params || {})
    return withFallback(
      () => axiosClient.get('/listings', { params }),
      () => ({ items: mockListings, total: mockListings.length }),
      { dedupeKey: `listings:get:${key}` },
    )
  },
  getListingById(id) {
    return withFallback(
      () => axiosClient.get(`/listings/${id}`),
      () => ({ item: mockListings.find((listing) => listing.id === id) || null }),
      { dedupeKey: `listings:detail:${id}` },
    )
  },
  getRelatedListings(id) {
    return withFallback(
      () => axiosClient.get(`/listings/${id}/related`),
      () => ({
        items: mockListings.filter((listing) => listing.id !== id).slice(0, 3),
      }),
      { dedupeKey: `listings:related:${id}` },
    )
  },
  toggleWishlist(id) {
    return withFallback(() => axiosClient.post(`/listings/${id}/wishlist`), {
      success: true,
    })
  },
  reportListing(id, payload) {
    return withFallback(() => axiosClient.post(`/listings/${id}/report`, payload), {
      success: true,
    })
  },
  submitReview(id, payload) {
    return withFallback(() => axiosClient.post(`/listings/${id}/review`, payload), {
      success: true,
    })
  },
  createOrder(id) {
    return withFallback(() => axiosClient.post(`/listings/${id}/order`), {
      success: true,
      message: 'Order request placed',
    })
  },
  submitOffer(id, payload) {
    return withFallback(() => axiosClient.post(`/listings/${id}/offer`, payload), {
      success: true,
      message: 'Offer sent to seller',
    })
  },
  updateListing(id, payload) {
    return withFallback(() => axiosClient.patch(`/listings/${id}`, payload), {
      success: true,
      item: { id, ...payload },
    })
  },
  createListing(payload) {
    return withFallback(() => axiosClient.post('/listings', payload), {
      success: true,
      item: payload,
    })
  },
  deleteListing(id) {
    return withFallback(() => axiosClient.delete(`/listings/${id}`), {
      success: true,
      id,
    })
  },
  updateListingStatus(id, status) {
    return withFallback(() => axiosClient.patch(`/listings/${id}/status`, { status }), {
      success: true,
      status,
    })
  },
}
