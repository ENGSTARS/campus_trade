import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatPrice } from '@/utils/formatters'
import { getListingPermissions } from '@/utils/listingPermissions'
import { SaveWishlistButton } from './SaveWishlistButton'

export function ListingCard({ listing, currentUser, onEdit, onDelete }) {
  const { isOwner } = getListingPermissions(listing, currentUser)

  return (
    <Card className="group overflow-hidden p-0 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_36px_-20px_rgba(67,56,202,0.45)]">
      <Link to={`/listings/${listing.id}`} className="relative block overflow-hidden">
        <img
          src={listing.images?.[0]}
          alt={listing.title}
          className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/35 via-transparent to-transparent" />
        <div className="absolute left-3 top-3">
          <Badge label={listing.condition} className="bg-white/95 text-slate-700" />
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-brand-700">{formatPrice(listing.price)}</p>
            <Link
              to={`/listings/${listing.id}`}
              className="line-clamp-2 text-sm font-semibold text-slate-800 transition hover:text-brand-700"
            >
              {listing.title}
            </Link>
          </div>
          {!isOwner && Boolean(currentUser) ? (
            <SaveWishlistButton listingId={listing.id} isWishlisted={listing.isWishlisted} />
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {isOwner ? <Badge label="Your Listing" /> : null}
          <Badge label={listing.type} />
          <Badge label={listing.status} />
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{listing.campus}</span>
        </div>

        {isOwner ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => onEdit?.(listing)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDelete?.(listing)}>
              Delete
            </Button>
          </div>
        ) : (
          <Link
            to={`/listings/${listing.id}`}
            className="inline-flex items-center text-xs font-semibold uppercase tracking-wide text-brand-700 transition hover:text-brand-800"
          >
            View Details
          </Link>
        )}
      </div>
    </Card>
  )
}
