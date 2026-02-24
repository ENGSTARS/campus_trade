import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { ListingsGrid } from '@/components/listings/ListingsGrid'
import { EmptyState } from '@/components/ui/EmptyState'

function SavedListingsPage() {
  const navigate = useNavigate()
  const { listings, isListingsLoading } = useApp()
  const { user: currentUser } = useAuth()

  const savedListings = useMemo(
    () =>
      listings.filter(
        (listing) => listing.isWishlisted && listing.sellerId !== currentUser?.id,
      ),
    [listings, currentUser],
  )

  return (
    <div className="space-y-4">
      <section className="card-surface p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
          Wishlist
        </p>
        <h1 className="font-display mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Saved Listings
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {savedListings.length} item{savedListings.length === 1 ? '' : 's'} saved for later.
        </p>
      </section>

      {savedListings.length === 0 && !isListingsLoading ? (
        <EmptyState
          title="No saved listings yet"
          description="Tap Save on listings you like and they will appear here."
          actionLabel="Browse Listings"
          onAction={() => navigate('/')}
        />
      ) : (
        <ListingsGrid
          listings={savedListings}
          loading={isListingsLoading}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}

export default SavedListingsPage
