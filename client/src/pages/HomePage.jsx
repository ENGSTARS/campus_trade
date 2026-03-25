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
    createOrderForListing,
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

  const handleOrderListing = async (listing) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const created = await createOrderForListing(listing, currentUser)
    if (!created) return
    addToast({ type: 'success', message: 'Order placed. The seller has been notified.' })
  }

  return (
    <div className="space-y-5">
      <section className="card-surface relative overflow-hidden bg-white/90 p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-brand-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-cyan-100/70 blur-3xl" />
        <div className="space-y-4 sticky top-[20px]">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <h1 className="font-display text-2xl font-bold text-slate-900">CampusTrade Marketplace</h1>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{filteredListings.length} listings</span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">Campus: {filters.campus}</span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-4">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <SearchBar
                value={searchValue}
                onChange={setSearchValue}
                onSearch={val => updateFilters({ query: val })}
                className="w-full"
              />
              <NavLink to={isAuthenticated ? '/sell' : '/login'} className="btn-primary whitespace-nowrap sm:self-auto self-start">Post an Item</NavLink>
            </div>
            
          </div>
        </div>
      </section>
      
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="h-fit md:sticky md:top-24">
          <FilterSidebar filters={filters} onChange={updateFilters} onReset={resetFilters}/>
        </div>
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <ListingsGrid
            listings={paginatedItems}
            loading={isListingsLoading}
            currentUser={currentUser}
            onEditListing={handleEditListing}
            onDeleteListing={handleDeleteListing}
            onOrderListing={handleOrderListing}
          />
          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </motion.section>
      </div>
    </div>
  )
}

export default HomePage
