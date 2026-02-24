import { ListingCard } from './ListingCard'

export function RelatedListings({ listings, currentUser, onEditListing, onDeleteListing }) {
  if (!listings.length) return null

  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-xl font-semibold text-slate-900">Related Listings</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </section>
  )
}
