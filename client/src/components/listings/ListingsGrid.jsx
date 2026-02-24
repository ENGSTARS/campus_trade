import { ListingCard } from './ListingCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

export function ListingsGrid({ listings, loading, currentUser, onEditListing, onDeleteListing }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="card-surface overflow-hidden p-0">
            <Skeleton className="h-44 w-full rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!listings.length) {
    return (
      <EmptyState
        title="No listings found"
        description="Try adjusting filters or searching with different keywords."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          currentUser={currentUser}
          onEdit={onEditListing}
          onDelete={onDeleteListing}
        />
      ))}
    </div>
  )
}
