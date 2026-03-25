import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { listingsApi } from '@/api/listingsApi'
import { ListingsGrid } from '@/components/listings/ListingsGrid'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/utils/formatters'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useNotifications } from '@/context/NotificationContext'
import { extractApiErrorMessage } from '@/utils/apiErrors'

function idsEqual(left, right) {
  return String(left) === String(right)
}

function SummaryCard({ label, value, tone = 'slate' }) {
  const toneClasses = {
    slate: 'border-slate-100 bg-slate-50 text-slate-900',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    rose: 'border-rose-100 bg-rose-50 text-rose-900',
  }

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  )
}

export default function MyProductsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { listings, deleteListing, updateListingStatus, setListings } = useApp()
  const { addToast } = useNotifications()
  const [pageListings, setPageListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadMyListings() {
      if (!user?.id) {
        if (isMounted) {
          setPageListings([])
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setLoadError('')
      try {
        const data = await listingsApi.getMyListings()
        if (!isMounted) return
        const items = data?.items || []
        setPageListings(items)
        setListings((previous) => {
          const byId = new Map(
            previous
              .filter((item) => !idsEqual(item.sellerId, user?.id))
              .map((item) => [item.id, item]),
          )
          items.forEach((item) => byId.set(item.id, item))
          return Array.from(byId.values())
        })
      } catch {
        if (!isMounted) return
        setLoadError('Could not load your products right now.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadMyListings()

    return () => {
      isMounted = false
    }
  }, [user?.id, setListings])

  const myListings = useMemo(() => {
    const source = pageListings.length ? pageListings : listings.filter((listing) => idsEqual(listing.sellerId, user?.id))
    return source.filter((listing) => idsEqual(listing.sellerId, user?.id))
  }, [pageListings, listings, user?.id])

  const inventory = useMemo(() => {
    const totalUnits = myListings.reduce((sum, listing) => sum + Number(listing.quantity ?? 0), 0)
    const soldOut = myListings.filter((listing) => Number(listing.quantity ?? 0) === 0).length
    const active = myListings.filter((listing) => listing.status === 'AVAILABLE').length
    const projectedRevenue = myListings.reduce(
      (sum, listing) => sum + Number(listing.price || 0) * Number(listing.quantity ?? 0),
      0,
    )

    return { totalUnits, soldOut, active, projectedRevenue }
  }, [myListings])

  const handleDeleteListing = async (listing) => {
    const shouldDelete = window.confirm(`Delete "${listing.title}"? This action cannot be undone.`)
    if (!shouldDelete) return
    try {
      const deleted = await deleteListing(listing.id)
      if (!deleted) return
      setPageListings((previous) => previous.filter((item) => String(item.id) !== String(listing.id)))
      addToast({ type: 'success', message: 'Listing deleted' })
    } catch (error) {
      addToast({ type: 'error', message: extractApiErrorMessage(error, 'Unable to delete this listing.') })
    }
  }

  const handleMarkSold = async (listingId) => {
    try {
      const updated = await updateListingStatus(listingId, 'SOLD')
      if (!updated) return
      setPageListings((previous) =>
        previous.map((item) =>
          String(item.id) === String(listingId) ? { ...item, status: 'SOLD', quantity: 0 } : item,
        ),
      )
      addToast({ type: 'success', message: 'Listing marked as sold' })
    } catch (error) {
      addToast({ type: 'error', message: extractApiErrorMessage(error, 'Unable to update listing status.') })
    }
  }

  if (loading) {
    return <Skeleton className="h-[420px] w-full" />
  }

  if (loadError) {
    return <ErrorState title="My Products Unavailable" description={loadError} />
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-8">
      <div className="flex flex-col gap-3 rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-brand-900 p-6 text-white shadow-[0_30px_60px_-30px_rgba(15,23,42,0.75)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">Seller Workspace</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">My Products</h1>
            <p className="max-w-2xl text-sm text-slate-200">
              Add new stock, review what is live, and keep counts accurate as orders come in.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/sell" className="btn-primary">
              Add Product
            </Link>
            <Button variant="secondary" onClick={() => navigate('/profile')}>
              Edit Seller Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Products Listed" value={myListings.length} />
        <SummaryCard label="Units In Stock" value={inventory.totalUnits} tone="emerald" />
        <SummaryCard label="Active Listings" value={inventory.active} tone="amber" />
        <SummaryCard label="Projected Revenue" value={formatPrice(inventory.projectedRevenue)} tone="rose" />
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Inventory Monitor</h2>
            <p className="text-sm text-slate-600">
              Sold-out listings: {inventory.soldOut}. Restock by editing the product quantity.
            </p>
          </div>
          <Link to="/sell" className="btn-secondary">
            Post Another Item
          </Link>
        </div>

        {myListings.length ? (
          <div className="mx-auto w-full max-w-4xl space-y-3">
            {myListings.map((listing) => (
              <div
                key={listing.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/listings/${listing.id}`}
                        className="min-w-0 text-base font-semibold text-slate-900 hover:text-brand-700 sm:text-lg"
                      >
                        {listing.title}
                      </Link>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {listing.status}
                      </span>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        {listing.quantity ?? 0} in stock
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {listing.campus} | {listing.category} | {listing.condition}
                    </p>
                    <p className="text-sm font-semibold text-brand-700">{formatPrice(listing.price)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:w-[260px] lg:justify-end">
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/listings/${listing.id}/edit`)}>
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleMarkSold(listing.id)}
                      disabled={listing.status === 'SOLD' || listing.status === 'RESERVED'}
                    >
                      Mark Sold
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteListing(listing)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-lg font-semibold text-slate-900">No products yet</p>
            <p className="mt-2 text-sm text-slate-600">
              Your listings will appear here once you add your first product.
            </p>
            <Link to="/sell" className="btn-primary mt-4 inline-flex">
              Add Your First Product
            </Link>
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Seller Links</h2>
          <p className="text-sm text-slate-600">
            Keep your buyer contact and payment channels current so checkout stays smooth.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          {user?.facebookLink ? <a href={user.facebookLink} target="_blank" rel="noopener" className="block text-blue-600">Facebook</a> : null}
          {user?.instagramLink ? <a href={user.instagramLink} target="_blank" rel="noopener" className="block text-pink-600">Instagram</a> : null}
          {user?.paymentLink ? <a href={user.paymentLink} target="_blank" rel="noopener" className="block text-emerald-600">Payment Method</a> : null}
          {!user?.facebookLink && !user?.instagramLink && !user?.paymentLink ? (
            <p className="text-slate-500">No business links added yet.</p>
          ) : null}
        </div>
        <Button onClick={() => navigate('/profile')}>Manage Profile Links</Button>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Marketplace View</h2>
        {myListings.length ? (
          <ListingsGrid
            listings={myListings}
            currentUser={user}
            onEditListing={(listing) => navigate(`/listings/${listing.id}/edit`)}
            onDeleteListing={handleDeleteListing}
          />
        ) : (
          <Card>
            <p className="text-sm text-slate-600">
              Once you add products, this section will show exactly how they appear to buyers.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
