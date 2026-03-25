import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listingsApi } from '@/api/listingsApi'
import { messagingApi } from '@/api/messagingApi'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { getListingPermissions } from '@/utils/listingPermissions'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ListingDetails } from '@/components/listings/ListingDetails'
import { RelatedListings } from '@/components/listings/RelatedListings'
import { ReportModal } from '@/components/listings/ReportModal'
import { ReviewModal } from '@/components/listings/ReviewModal'

function ListingDetailsPage() {
  const navigate = useNavigate()
  const { listingId } = useParams()
  const { listings, deleteListing, updateListingStatus, createOrderForListing } = useApp()
  const { user: currentUser } = useAuth()
  const { addToast } = useNotifications()

  const [listing, setListing] = useState(null)
  const [related, setRelated] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [reportOpen, setReportOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)

  useEffect(() => {
    async function loadDetails() {
      setIsLoading(true)
      setError('')
      try {
        const [detail, relatedData] = await Promise.all([
          listingsApi.getListingById(listingId),
          listingsApi.getRelatedListings(listingId),
        ])
        setListing(detail?.item || null)
        setRelated(relatedData?.items || [])
      } catch {
        setError('Could not load listing details')
      } finally {
        setIsLoading(false)
      }
    }
    loadDetails()
  }, [listingId])

  const resolvedListing = useMemo(
    () => listings.find((item) => String(item.id) === String(listingId)) || listing,
    [listings, listingId, listing],
  )
  const permissions = resolvedListing ? getListingPermissions(resolvedListing, currentUser) : null

  const syncSellerThread = async (message) => {
    if (!resolvedListing || !currentUser?.id) return
    try {
      const conversation = await messagingApi.upsertConversation(
        {
          participantId: resolvedListing.sellerId,
          name: resolvedListing.seller?.name,
          listingId: resolvedListing.id,
          senderId: currentUser.id,
          senderName: currentUser.fullName || currentUser.email || 'Student',
        },
        currentUser.id,
      )

      await messagingApi.sendMessage(
        conversation.id,
        {
          message,
          participantId: resolvedListing.sellerId,
          participantName: resolvedListing.seller?.name,
          senderId: currentUser.id,
          senderName: currentUser.fullName || currentUser.email || 'Student',
          listingId: resolvedListing.id,
        },
        currentUser.id,
      )
    } catch {
      // Keep order/offer successful even if chat sync fails.
    }
  }

  const [guestOrderOpen, setGuestOrderOpen] = useState(false)
  const handleOrder = async () => {
    if (!permissions) return
    if (!permissions.isLoggedIn) {
      setGuestOrderOpen(true)
      return
    }
    if (!permissions.canBuyOrOffer) return

    const created = await createOrderForListing(resolvedListing, currentUser)
    if (!created) return

    setListing((previous) =>
      previous
        ? {
            ...previous,
            quantity: created.quantity,
            status: created.status,
          }
        : previous,
    )
    setRelated((previous) =>
      previous.map((item) =>
        item.id === resolvedListing.id
          ? {
              ...item,
              quantity: created.quantity,
              status: created.status,
            }
          : item,
      ),
    )
    addToast({ type: 'success', message: 'Order placed. The seller has been notified.' })
  }

  // Guest order modal
  const handleGuestOrder = async () => {
    setGuestOrderOpen(false)
    addToast({ type: 'info', message: 'Guest ordering is not enabled yet. Please sign in to place an order.' })
  }

  const handleReport = async (values) => {
    if (!permissions || !permissions.isLoggedIn || permissions.isOwner) return
    await listingsApi.reportListing(listingId, values)
    addToast({ type: 'info', message: 'Listing reported successfully' })
  }

  const handleReview = async (values) => {
    if (!permissions || !permissions.isLoggedIn || permissions.isOwner) return
    await listingsApi.submitReview(listingId, values)
    addToast({ type: 'success', message: 'Review submitted' })
  }

  const handleEdit = () => {
    navigate(`/listings/${listingId}/edit`)
  }

  const handleDelete = async () => {
    if (!permissions?.isOwner || !permissions.isAvailable) return
    const shouldDelete = window.confirm('Delete this listing? This action cannot be undone.')
    if (!shouldDelete) return

    const deleted = await deleteListing(listingId)
    if (!deleted) return
    addToast({ type: 'success', message: 'Listing deleted' })
    navigate('/')
  }

  const handleMarkStatus = async (status) => {
    if (!permissions?.isOwner || !permissions.isAvailable) return
    const updated = await updateListingStatus(listingId, status)
    if (!updated) return
    addToast({ type: 'success', message: `Listing marked as ${status.toLowerCase()}` })
  }

  const handleMessageSeller = async () => {
    if (!permissions?.canMessageSeller) return
    const conversation = await messagingApi.upsertConversation({
      participantId: resolvedListing.sellerId,
      name: resolvedListing.seller?.name,
      listingId: resolvedListing.id,
      senderId: currentUser?.id,
      senderName: currentUser?.fullName || currentUser?.email || 'Student',
    }, currentUser?.id)

    navigate('/messages', {
      state: {
        conversationId: conversation.id,
      },
    })
  }

  const handleRelatedEdit = (item) => {
    if (!item?.id) return
    navigate(`/listings/${item.id}/edit`)
  }

  const handleRelatedDelete = async (item) => {
    if (!item?.id) return
    const relatedPermissions = getListingPermissions(item, currentUser)
    if (!relatedPermissions.isOwner || !relatedPermissions.isAvailable) return
    const shouldDelete = window.confirm('Delete this listing? This action cannot be undone.')
    if (!shouldDelete) return

    const deleted = await deleteListing(item.id)
    if (!deleted) return
    setRelated((previous) => previous.filter((listing) => listing.id !== item.id))
    addToast({ type: 'success', message: 'Listing deleted' })
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Skeleton className="h-[420px] w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    )
  }

  if (error) {
    return <ErrorState title="Unable to open listing" description={error} />
  }

  if (!resolvedListing) {
    return <ErrorState title="Listing not found" description="This listing may have been removed." />
  }

  return (
    <div>
      <ListingDetails
        listing={resolvedListing}
        currentUser={currentUser}
        onOrder={handleOrder}
        onReport={() => setReportOpen(true)}
        onReview={() => setReviewOpen(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMarkStatus={handleMarkStatus}
        onMessageSeller={handleMessageSeller}
      />

      <RelatedListings
        listings={related}
        currentUser={currentUser}
        onEditListing={handleRelatedEdit}
        onDeleteListing={handleRelatedDelete}
      />

      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} onSubmit={handleReport} />
      <ReviewModal isOpen={reviewOpen} onClose={() => setReviewOpen(false)} onSubmit={handleReview} />
      {guestOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-bold mb-2">Guest Order</h2>
            <form className="space-y-3" onSubmit={e => {
              e.preventDefault();
              handleGuestOrder();
            }}>
              <input name="name" required placeholder="Full Name" className="input-base w-full" />
              <input name="email" required type="email" placeholder="Email" className="input-base w-full" />
              <input name="phone" required placeholder="Phone Number" className="input-base w-full" />
              <input name="pickupLocation" required placeholder="Pickup Location" className="input-base w-full" />
              <div className="flex gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setGuestOrderOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Place Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListingDetailsPage
