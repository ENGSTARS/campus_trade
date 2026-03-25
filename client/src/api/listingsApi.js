import { axiosClient } from './axiosClient'
import { withFallback } from './fallback'
import { mockListings } from '@/utils/mockData'

function normalizeListing(item) {
  if (!item) return item
  const quantity =
    typeof item.quantity === 'number' ? item.quantity : item.status === 'SOLD' ? 0 : 1
  const status = quantity === 0 ? 'SOLD' : item.status || 'AVAILABLE'
  return { ...item, quantity, status }
}

export const listingsApi = {
  async getListings(params = {}) {
    const key = JSON.stringify(params || {})
    const data = await withFallback(
      () => axiosClient.get('/listings/', { params }),
      () => ({ items: mockListings, total: mockListings.length }),
      { dedupeKey: `listings:get:${key}` },
    )
    if (Array.isArray(data)) {
      return { items: data.map(normalizeListing), total: data.length }
    }
    const items = (data?.items || []).map(normalizeListing)
    return {
      items,
      total: data?.total ?? items.length ?? 0,
    }
  },
  async getMyListings(params = {}) {
    const key = JSON.stringify(params || {})
    const data = await withFallback(
      () => axiosClient.get('/listings/mine/', { params }),
      () => ({ items: [] }),
      { dedupeKey: `listings:mine:${key}` },
    )
    const items = (data?.items || (Array.isArray(data) ? data : [])).map(normalizeListing)
    return {
      items,
      total: data?.total ?? items.length,
    }
  },
  getListingById(id) {
    return withFallback(
      () => axiosClient.get(`/listings/${id}/`),
      () => ({ item: mockListings.find((listing) => listing.id === id) || null }),
      { dedupeKey: `listings:detail:${id}` },
    ).then((data) => {
      if (!data) return { item: null }
      if (data.item !== undefined) return { ...data, item: normalizeListing(data.item) }
      return { item: normalizeListing(data) }
    })
  },
  getRelatedListings(id) {
    return withFallback(
      () => axiosClient.get(`/listings/${id}/related/`),
      () => ({
        items: mockListings.filter((listing) => listing.id !== id).slice(0, 3),
      }),
      { dedupeKey: `listings:related:${id}` },
    ).then((data) => ({ items: (data?.items || []).map(normalizeListing) }))
  },
  toggleWishlist(id) {
    return withFallback(() => axiosClient.post(`/listings/${id}/wishlist/`), {
      success: true,
    })
  },
  reportListing(id, payload) {
    return withFallback(() => axiosClient.post(`/listings/${id}/report/`, payload), {
      success: true,
    })
  },
  submitReview(id, payload) {
    const normalizedPayload = {
      ...payload,
      content: payload?.content ?? payload?.comment ?? '',
    }
    delete normalizedPayload.comment

    return withFallback(() => axiosClient.post(`/listings/${id}/review/`, normalizedPayload), {
      success: true,
    })
  },
  createOrder(id) {
    return withFallback(() => axiosClient.post(`/listings/${id}/order/`), {
      success: true,
      message: 'Order request placed',
    })
  },
  submitOffer(id, payload) {
    return withFallback(() => axiosClient.post(`/listings/${id}/offer/`, payload), {
      success: true,
      message: 'Offer sent to seller',
    })
  },
  uploadImage(file) {
    const formData = new FormData()
    formData.append('image', file)
    return axiosClient
      .post('/listings/upload-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => response.data)
  },
  updateListing(id, payload) {
    return withFallback(() => axiosClient.patch(`/listings/${id}/`, payload), {
      success: true,
      item: { id, ...payload },
    }).then((data) => {
      if (!data) return { item: null }
      if (data.item !== undefined) return { ...data, item: normalizeListing(data.item) }
      return { item: normalizeListing(data) }
    })
  },
  createListing(payload) {
    return withFallback(() => axiosClient.post('/listings/', payload), {
      success: true,
      item: payload,
    }).then((data) => {
      if (!data) return { item: null }
      if (data.item !== undefined) return { ...data, item: normalizeListing(data.item) }
      return { item: normalizeListing(data) }
    })
  },
  deleteListing(id) {
    return withFallback(() => axiosClient.delete(`/listings/${id}/`), {
      success: true,
      id,
    })
  },
  updateListingStatus(id, status) {
    return withFallback(() => axiosClient.patch(`/listings/${id}/status/`, { status }), {
      success: true,
      status,
      quantity: status === 'SOLD' ? 0 : undefined,
    })
  },
}
