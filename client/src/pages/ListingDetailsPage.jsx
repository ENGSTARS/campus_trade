import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listingsApi } from '@/api/listingsApi'
import { messagingApi } from '@/api/messagingApi'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { getListingPermissions } from '@/utils/listingPermissions'
import { extractApiErrorMessage } from '@/utils/apiErrors'
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

  const handleOrder = async () => {
    if (!permissions) return
    if (!permissions.isLoggedIn) {
      navigate('/login', { state: { from: `/listings/${listingId}` } })
      return
    }
    if (!permissions.canBuyOrOffer) return

    try {
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
          String(item.id) === String(resolvedListing.id)
            ? {
                ...item,
                quantity: created.quantity,
                status: created.status,
              }
            : item,
        ),
      )
      addToast({ type: 'success', message: 'Order placed. The seller has been notified.' })
    } catch (error) {
      addToast({ type: 'error', message: extractApiErrorMessage(error, 'Unable to place this order.') })
    }
  }

  const handleReport = async (values) => {
    if (!permissions || !permissions.isLoggedIn || permissions.isOwner) return
    try {
      await listingsApi.reportListing(listingId, values)
      addToast({ type: 'info', message: 'Listing reported successfully' })
    } catch (error) {
      addToast({ type: 'error', message: extractApiErrorMessage(error, 'Unable to submit this report.') })
    }
  }

  const handleReview = async (values) => {
    if (!permissions || !permissions.isLoggedIn || permissions.isOwner) return
    try {
      await listingsApi.submitReview(listingId, values)
      addToast({ type: 'success', message: 'Review submitted' })
    } catch (error) {
      addToast({ type: 'error', message: extractApiErrorMessage(error, 'Unable to submit your review.') })
      throw error
    }
  }

  const handleEdit = () => {
    navigate(`/listings/${listingId}/edit`)
  }

  const handleDelete = async () => {
    if (!permissions?.isOwner) return
    const shouldDelete = window.confirm('Delete this listing? This action cannot be undone.')
    if (!shouldDelete) return

    try {
      const deleted = await deleteListing(listingId)
      if (!deleted) return
      addToast({ type: 'success', message: 'Listing deleted' })
      navigate('/')
    } catch (error) {
      addToast({ type: 'error', message: extractApiErrorMessage(error, 'Unable to delete this listing.') })
    }
  }

  const handleMarkStatus = async (status) => {
    if (!permissions?.isOwner || !permissions.isAvailable) return
    try {
      const updated = await updateListingStatus(listingId, status)
      if (!updated) return
      addToast({ type: 'success', message: `Listing marked as ${status.toLowerCase()}` })
    } catch (error) {
      addToast({ type: 'error', message: extractApiErrorMessage(error, 'Unable to update listing status.') })
    }
  }

  const handleMessageSeller = async () => {
    if (!permissions?.canMessageSeller) return
    try {
      const conversation = await messagingApi.upsertConversation({
        participantId: resolvedListing.sellerId,
        listingId: resolvedListing.id,
      })

      navigate('/messages', {
        state: {
          conversationId: conversation.id,
        },
      })
    } catch (error) {
      addToast({ type: 'error', message: extractApiErrorMessage(error, 'Unable to open this conversation.') })
    }
  }

  const handleRelatedEdit = (item) => {
    if (!item?.id) return
    navigate(`/listings/${item.id}/edit`)
  }

  const handleRelatedDelete = async (item) => {
    if (!item?.id) return
    const relatedPermissions = getListingPermissions(item, currentUser)
    if (!relatedPermissions.isOwner) return
    const shouldDelete = window.confirm('Delete this listing? This action cannot be undone.')
    if (!shouldDelete) return

    try {
      const deleted = await deleteListing(item.id)
      if (!deleted) return
      setRelated((previous) => previous.filter((listing) => String(listing.id) !== String(item.id)))
      addToast({ type: 'success', message: 'Listing deleted' })
    } catch (error) {
      addToast({ type: 'error', message: extractApiErrorMessage(error, 'Unable to delete this listing.') })
    }
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
    </div>
  )
}

export default ListingDetailsPage
