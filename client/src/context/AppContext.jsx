import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { listingsApi } from '@/api/listingsApi'
import { profileApi } from '@/api/profileApi'
import { useAuth } from '@/context/AuthContext'
const AppContext = createContext(null)

const defaultCampus = 'all'
const WISHLIST_STORAGE_KEY = 'campustrade-wishlist-by-user'

function readWishlistStore() {
  const raw = localStorage.getItem(WISHLIST_STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function getWishlistEntry(userId) {
  const store = readWishlistStore()
  if (!userId || !Object.prototype.hasOwnProperty.call(store, userId)) {
    return { hasEntry: false, ids: [] }
  }
  const ids = Array.isArray(store[userId]) ? store[userId] : []
  return { hasEntry: true, ids }
}

function saveWishlistEntry(userId, ids) {
  if (!userId) return
  const store = readWishlistStore()
  store[userId] = ids
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(store))
}

const initialFilters = {
  query: '',
  category: 'all',
  condition: 'all',
  type: 'all',
  minPrice: '',
  maxPrice: '',
  campus: defaultCampus,
}

function idsEqual(left, right) {
  return String(left) === String(right)
}

export function AppProvider({ children }) {
  const { user: currentUser } = useAuth()
  const [filters, setFilters] = useState(initialFilters)
  const [listings, setListings] = useState([])
  const [transactions, setTransactions] = useState([])
  const [isListingsLoading, setIsListingsLoading] = useState(true)
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true)
  const [listingsError, setListingsError] = useState('')
  const [transactionsError, setTransactionsError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    localStorage.setItem('campustrade-campus', filters.campus)
  }, [filters.campus])

  useEffect(() => {
    async function loadListings() {
      setIsListingsLoading(true)
      setListingsError('')
      try {
        const data = await listingsApi.getListings()
        setListings(data?.items || [])
      } catch {
        setListingsError('Could not load listings')
      } finally {
        setIsListingsLoading(false)
      }
    }
    loadListings()
  }, [])

  useEffect(() => {
    async function loadTransactions() {
      if (!currentUser?.id) {
        setTransactions([])
        setTransactionsError('')
        setIsTransactionsLoading(false)
        return
      }

      setIsTransactionsLoading(true)
      setTransactionsError('')
      try {
        const data = await profileApi.getTransactions()
        setTransactions(data?.items || [])
      } catch {
        setTransactionsError('Could not load orders')
      } finally {
        setIsTransactionsLoading(false)
      }
    }

    loadTransactions()
  }, [currentUser?.id])

  useEffect(() => {
    if (!listings.length) return

    if (!currentUser?.id) {
      setListings((previous) =>
        previous.map((listing) =>
          listing.isWishlisted ? { ...listing, isWishlisted: false } : listing,
        ),
      )
      return
    }

    const { hasEntry, ids } = getWishlistEntry(currentUser.id)
    if (!hasEntry) {
      const seedIds = listings.filter((listing) => listing.isWishlisted).map((listing) => listing.id)
      saveWishlistEntry(currentUser.id, seedIds)
      return
    }

    const idSet = new Set(ids)
    setListings((previous) =>
      previous.map((listing) => {
        const isWishlisted = idSet.has(listing.id)
        return listing.isWishlisted === isWishlisted ? listing : { ...listing, isWishlisted }
      }),
    )
  }, [currentUser?.id, listings.length])

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      if (
        filters.query &&
        !`${listing.title} ${listing.description}`
          .toLowerCase()
          .includes(filters.query.toLowerCase())
      ) {
        return false
      }
      if (filters.campus !== 'all' && listing.campus !== filters.campus) return false
      if (filters.category !== 'all' && listing.category !== filters.category) return false
      if (filters.condition !== 'all' && listing.condition !== filters.condition) return false
      if (filters.type !== 'all' && listing.type !== filters.type) return false
      if (filters.minPrice && listing.price < Number(filters.minPrice)) return false
      if (filters.maxPrice && listing.price > Number(filters.maxPrice)) return false
      return true
    })
  }, [filters, listings])

  const updateFilters = (patch) => {
    setCurrentPage(1)
    setFilters((previous) => ({ ...previous, ...patch }))
  }

  const resetFilters = () => {
    setCurrentPage(1)
    setFilters(initialFilters)
  }

  const toggleWishlist = async (listingId) => {
    if (!currentUser?.id) return null

    const response = await listingsApi.toggleWishlist(listingId)
    const nextIsWishlisted = Boolean(response?.wishlisted)
    const { ids } = getWishlistEntry(currentUser.id)
    const nextIds = nextIsWishlisted
      ? Array.from(new Set([...ids, listingId]))
      : ids.filter((id) => !idsEqual(id, listingId))

    saveWishlistEntry(currentUser.id, nextIds)
    setListings((previous) =>
      previous.map((listing) =>
        idsEqual(listing.id, listingId) ? { ...listing, isWishlisted: nextIsWishlisted } : listing,
      ),
    )
    return nextIsWishlisted
  }

  const updateListing = async (listingId, patch) => {
    const currentListing = listings.find((listing) => idsEqual(listing.id, listingId))
    if (!currentListing) return null
    if (!idsEqual(currentListing.sellerId, currentUser?.id)) return null

    const response = await listingsApi.updateListing(listingId, patch)
    const updatedListing = response?.item ? { ...currentListing, ...response.item } : { ...currentListing, ...patch }
    setListings((previous) =>
      previous.map((listing) => (idsEqual(listing.id, listingId) ? { ...listing, ...updatedListing } : listing)),
    )
    return updatedListing
  }

  const updateListingStatus = async (listingId, status) => {
    const currentListing = listings.find((listing) => idsEqual(listing.id, listingId))
    if (!currentListing) return false
    if (!idsEqual(currentListing.sellerId, currentUser?.id)) return false

    const response = await listingsApi.updateListingStatus(listingId, status)
    setListings((previous) =>
      previous.map((listing) =>
        idsEqual(listing.id, listingId)
          ? {
              ...listing,
              status: response?.status || status,
              quantity:
                typeof response?.quantity === 'number' ? response.quantity : listing.quantity,
            }
          : listing,
      ),
    )
    return true
  }

  const deleteListing = async (listingId) => {
    const currentListing = listings.find((listing) => idsEqual(listing.id, listingId))
    if (!currentListing) return false
    if (!idsEqual(currentListing.sellerId, currentUser?.id)) return false

    await listingsApi.deleteListing(listingId)
    setListings((previous) => previous.filter((listing) => !idsEqual(listing.id, listingId)))
    return true
  }

  const createListing = async (payload, user) => {
    if (!user?.id) return null

    const imageUrl =
      payload.imageUrl ||
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80'
    const normalizedPayload = {
      title: payload.title.trim(),
      description: payload.description.trim(),
      price: Number(payload.price),
      campus: payload.campus,
      category: payload.category,
      condition: payload.condition,
      type: payload.type,
      quantity: Number(payload.quantity),
      images: [imageUrl],
    }

    const response = await listingsApi.createListing(normalizedPayload)
    const createdListing = response?.item || null
    if (createdListing) {
      setListings((previous) => [createdListing, ...previous])
    }
    return createdListing
  }

  const createOrderForListing = async (listing, user) => {
    if (!listing?.id || !user?.id) return null
    if (idsEqual(listing.sellerId, user.id)) return null
    if (listing.status !== 'AVAILABLE') return null

    const response = await listingsApi.createOrder(listing.id)
    const nextTransaction = {
      id: response?.order_id || `t-${Date.now()}`,
      listingId: listing.id,
      buyerId: user.id,
      sellerId: listing.sellerId,
      item: listing.title,
      amount: listing.price,
      status: 'Completed',
      date: new Date().toISOString(),
    }

    setTransactions((previous) => [nextTransaction, ...previous])
    setListings((previous) =>
      previous.map((item) =>
        idsEqual(item.id, listing.id)
          ? {
              ...item,
              quantity:
                typeof response?.quantity === 'number'
                  ? response.quantity
                  : Math.max(0, Number(item.quantity ?? 1) - 1),
              status: response?.status || item.status,
            }
          : item,
      ),
    )
    return {
      transaction: nextTransaction,
      quantity:
        typeof response?.quantity === 'number'
          ? response.quantity
          : Math.max(0, Number(listing.quantity ?? 1) - 1),
      status:
        response?.status ||
        (typeof response?.quantity === 'number' && response.quantity === 0 ? 'SOLD' : listing.status),
    }
  }

  const value = useMemo(
    () => ({
      filters,
      updateFilters,
      resetFilters,
      listings,
      filteredListings,
      transactions,
      isListingsLoading,
      isTransactionsLoading,
      listingsError,
      transactionsError,
      currentPage,
      setCurrentPage,
      toggleWishlist,
      updateListing,
      updateListingStatus,
      deleteListing,
      createListing,
      createOrderForListing,
      setListings,
      setTransactions,
    }),
    [
      filters,
      listings,
      filteredListings,
      transactions,
      isListingsLoading,
      isTransactionsLoading,
      listingsError,
      transactionsError,
      currentPage,
      currentUser?.id,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
