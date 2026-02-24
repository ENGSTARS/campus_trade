import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { useDebounce } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { Pagination } from '@/components/ui/Pagination'
import { ErrorState } from '@/components/ui/ErrorState'
import { FilterSidebar } from '@/components/listings/FilterSidebar'
import { ListingsGrid } from '@/components/listings/ListingsGrid'

function HomePage() {
  const navigate = useNavigate()
  const { user: currentUser, isAuthenticated } = useAuth()
  const { addToast } = useNotifications()
  const {
    filters,
    updateFilters,
    resetFilters,
    filteredListings,
    isListingsLoading,
    listingsError,
    currentPage,
    setCurrentPage,
    deleteListing,
  } = useApp()
  const [searchValue, setSearchValue] = useState(filters.query)
  const debouncedSearch = useDebounce(searchValue)
  const { paginatedItems, totalPages, safePage } = usePagination(filteredListings, currentPage, 6)

  useEffect(() => {
    updateFilters({ query: debouncedSearch })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  useEffect(() => {
    if (safePage !== currentPage) setCurrentPage(safePage)
  }, [safePage, currentPage, setCurrentPage])

  if (listingsError) {
    return <ErrorState title="Unable to load listings" description={listingsError} />
  }

  const handleEditListing = (listing) => {
    navigate(`/listings/${listing.id}/edit`)
  }

  const handleDeleteListing = async (listing) => {
    const shouldDelete = window.confirm('Delete this listing? This action cannot be undone.')
    if (!shouldDelete) return

    const deleted = await deleteListing(listing.id)
    if (!deleted) return
    addToast({ type: 'success', message: 'Listing deleted' })
  }

  return (
    <div className="space-y-5">
      <section className="card-surface relative overflow-hidden bg-white/90 p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-brand-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-cyan-100/70 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Verified Student Marketplace</p>
          <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Find Great Deals Near Your Campus
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Default campus filter is set to <strong>{filters.campus}</strong>. Search and narrow down listings instantly.
          </p>
          <div className="mt-4">
            <SearchBar value={searchValue} onChange={setSearchValue} />
          </div>

          <div className="mt-4">
            <NavLink to={isAuthenticated ? '/sell' : '/login'} className="btn-primary">
              Post an Item
            </NavLink>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {filteredListings.length} listings
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              Campus filter: {filters.campus}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <FilterSidebar filters={filters} onChange={updateFilters} onReset={resetFilters} />
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between rounded-2xl border border-brand-100/80 bg-white/80 px-4 py-3">
            <p className="text-sm text-slate-600">
              Showing <strong>{filteredListings.length}</strong> listings
            </p>
          </div>
          <ListingsGrid
            listings={paginatedItems}
            loading={isListingsLoading}
            currentUser={currentUser}
            onEditListing={handleEditListing}
            onDeleteListing={handleDeleteListing}
          />
          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </motion.section>
      </div>
    </div>
  )
}

export default HomePage
