import { axiosClient } from './axiosClient'

function normalizeListing(item) {
  if (!item) return item
  const quantity =
    typeof item.quantity === 'number' ? item.quantity : item.status === 'SOLD' ? 0 : 1
  const status =
    quantity === 0
      ? 'SOLD'
      : item.status === 'RESERVED' && quantity === 1
        ? 'RESERVED'
        : 'AVAILABLE'
  return { ...item, quantity, status }
}

export const listingsApi = {
  async getListings(params = {}) {
    const response = await axiosClient.get('/listings/', { params })
    const data = response?.data ?? response
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
    const response = await axiosClient.get('/listings/mine/', { params })
    const data = response?.data ?? response
    const items = (data?.items || (Array.isArray(data) ? data : [])).map(normalizeListing)
    return {
      items,
      total: data?.total ?? items.length,
    }
  },
  getListingById(id) {
    return axiosClient.get(`/listings/${id}/`).then((response) => {
      const data = response?.data ?? response
      if (!data) return { item: null }
      if (data.item !== undefined) return { ...data, item: normalizeListing(data.item) }
      return { item: normalizeListing(data) }
    })
  },
  getRelatedListings(id) {
    return axiosClient.get(`/listings/${id}/related/`).then((response) => {
      const data = response?.data ?? response
      return { items: (data?.items || []).map(normalizeListing) }
    })
  },
  toggleWishlist(id) {
    return axiosClient.post(`/listings/${id}/wishlist/`).then((response) => response?.data ?? response)
  },
  reportListing(id, payload) {
    return axiosClient.post(`/listings/${id}/report/`, payload).then((response) => response?.data ?? response)
  },
  submitReview(id, payload) {
    const normalizedPayload = {
      ...payload,
      content: payload?.content ?? payload?.comment ?? '',
    }
    delete normalizedPayload.comment

    return axiosClient.post(`/listings/${id}/review/`, normalizedPayload).then((response) => response?.data ?? response)
  },
  createOrder(id) {
    return axiosClient.post(`/listings/${id}/order/`).then((response) => response?.data ?? response)
  },
  submitOffer(id, payload) {
    return axiosClient.post(`/listings/${id}/offer/`, payload).then((response) => response?.data ?? response)
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
    return axiosClient.patch(`/listings/${id}/`, payload).then((response) => {
      const data = response?.data ?? response
      if (!data) return { item: null }
      if (data.item !== undefined) return { ...data, item: normalizeListing(data.item) }
      return { item: normalizeListing(data) }
    })
  },
  createListing(payload) {
    return axiosClient.post('/listings/', payload).then((response) => {
      const data = response?.data ?? response
      if (!data) return { item: null }
      if (data.item !== undefined) return { ...data, item: normalizeListing(data.item) }
      return { item: normalizeListing(data) }
    })
  },
  deleteListing(id) {
    return axiosClient.delete(`/listings/${id}/`).then((response) => response?.data ?? response)
  },
  updateListingStatus(id, status) {
    return axiosClient.patch(`/listings/${id}/status/`, { status }).then((response) => response?.data ?? response)
  },
}
