import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatPrice } from '@/utils/formatters'
import { getListingPermissions } from '@/utils/listingPermissions'
import { SaveWishlistButton } from './SaveWishlistButton'

export function ListingMeta({
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
  const { isLoggedIn, isOwner, isAvailable, isSecondHand, isNew, canBuyOrOffer } = getListingPermissions(
    listing,
    currentUser,
  )

  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-slate-900">{listing.title}</h1>
        <p className="text-2xl font-bold text-brand-700">{formatPrice(listing.price)}</p>
        <p className="text-sm leading-relaxed text-slate-600">{listing.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge label={listing.condition} />
        <Badge label={listing.type} />
        <Badge label={listing.status} />
        {isOwner ? <Badge label="Your Listing" /> : null}
        <span className="text-xs text-slate-500">{listing.category}</span>
        <span className="text-xs text-slate-500">{listing.campus}</span>
      </div>

      <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3">
        <p className="text-sm font-semibold text-slate-800">Seller</p>
        <p className="text-sm text-slate-700">{listing.seller.name}</p>
        <p className="text-xs text-slate-500">
          Rating {listing.seller.rating} | {listing.seller.transactions} transactions
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {isOwner ? (
          <>
            <Button variant="secondary" onClick={onEdit} disabled={!isAvailable}>
              Edit Listing
            </Button>
            <Button variant="danger" onClick={onDelete} disabled={!isAvailable}>
              Delete Listing
            </Button>
            <Button variant="secondary" onClick={() => onMarkStatus('RESERVED')} disabled={!isAvailable}>
              Mark Reserved
            </Button>
            <Button variant="secondary" onClick={() => onMarkStatus('SOLD')} disabled={!isAvailable}>
              Mark Sold
            </Button>
          </>
        ) : !isLoggedIn ? (
          <Link to="/login" className="btn-primary">
            Login to Continue
          </Link>
        ) : (
          <>
            {isSecondHand ? (
              <Button onClick={onOffer} disabled={!canBuyOrOffer}>
                Make Offer
              </Button>
            ) : null}
            {isNew ? (
              <Button onClick={onOrder} disabled={!canBuyOrOffer}>
                Place Order
              </Button>
            ) : null}
          </>
        )}

        {!isOwner && isLoggedIn ? (
          <Button variant="secondary" onClick={onMessageSeller} disabled={isOwner}>
            Message Seller
          </Button>
        ) : null}

        {!isOwner && isLoggedIn ? (
          <SaveWishlistButton listingId={listing.id} isWishlisted={listing.isWishlisted} disabled={!isAvailable} />
        ) : null}

        {!isOwner ? (
          <Button variant="ghost" onClick={onReport} disabled={!isLoggedIn}>
            Report
          </Button>
        ) : null}

        {!isOwner && isLoggedIn ? (
          <Button variant="secondary" onClick={onReview}>
            Leave Review
          </Button>
        ) : null}

        {!isAvailable ? (
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            Listing is not available right now.
          </span>
        ) : null}
      </div>
    </Card>
  )
}
