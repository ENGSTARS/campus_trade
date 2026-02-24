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
import { OfferModal } from '@/components/listings/OfferModal'
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

  const [offerOpen, setOfferOpen] = useState(false)
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
    () => listings.find((item) => item.id === listingId) || listing,
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
        },
        currentUser.id,
      )

      await messagingApi.sendMessage(
        conversation.id,
        {
          message,
          participantId: resolvedListing.sellerId,
          participantName: resolvedListing.seller?.name,
        },
        currentUser.id,
      )
    } catch {
      // Keep order/offer successful even if chat sync fails.
    }
  }

  const handleOffer = async (values) => {
    if (!permissions) return
    if (!permissions.isLoggedIn) {
      navigate('/login')
      return
    }
    if (!permissions.canBuyOrOffer) return
    await listingsApi.submitOffer(listingId, values)
    const summary = values.note?.trim()
      ? `Hi! I sent an offer of $${values.amount}. Note: ${values.note.trim()}`
      : `Hi! I sent an offer of $${values.amount}.`
    await syncSellerThread(summary)
    addToast({ type: 'success', message: 'Offer sent to seller' })
  }

  const handleOrder = async () => {
    if (!permissions) return
    if (!permissions.isLoggedIn) {
      navigate('/login')
      return
    }
    if (!permissions.canBuyOrOffer) return

    const created = await createOrderForListing(resolvedListing, currentUser)
    if (!created) return

    setListing((previous) => (previous ? { ...previous, status: 'SOLD' } : previous))
    setRelated((previous) =>
      previous.map((item) => (item.id === resolvedListing.id ? { ...item, status: 'SOLD' } : item)),
    )
    await syncSellerThread(`Hi! I placed an order for "${resolvedListing.title}".`)
    addToast({ type: 'success', message: 'Order placed. You can now message the seller.' })
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
        onOffer={() => setOfferOpen(true)}
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

      <OfferModal isOpen={offerOpen} onClose={() => setOfferOpen(false)} onSubmit={handleOffer} />
      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} onSubmit={handleReport} />
      <ReviewModal isOpen={reviewOpen} onClose={() => setReviewOpen(false)} onSubmit={handleReview} />
    </div>
  )
}

export default ListingDetailsPage
