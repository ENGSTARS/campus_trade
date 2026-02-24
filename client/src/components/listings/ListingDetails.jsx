import { ListingGallery } from './ListingGallery'
import { ListingMeta } from './ListingMeta'

export function ListingDetails({
  listing,
  currentUser,
  onOffer,
  onOrder,
  onReport,
  onReview,
  onEdit,
  onDelete,
  onMarkStatus,
  onMessageSeller,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <ListingGallery images={listing.images} title={listing.title} />
      <ListingMeta
        listing={listing}
        currentUser={currentUser}
        onOffer={onOffer}
        onOrder={onOrder}
        onReport={onReport}
        onReview={onReview}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkStatus={onMarkStatus}
        onMessageSeller={onMessageSeller}
      />
    </div>
  )
}
