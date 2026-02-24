import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { profileApi } from '@/api/profileApi'
import { listingsApi } from '@/api/listingsApi'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { CAMPUS_OPTIONS } from '@/utils/constants'
import { profileSchema } from '@/utils/validators'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { TransactionHistory } from '@/components/profile/TransactionHistory'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ReviewModal } from '@/components/listings/ReviewModal'

function ProfilePage() {
  const navigate = useNavigate()
  const {
    listings,
    transactions,
    isTransactionsLoading,
    transactionsError,
    deleteListing,
    toggleWishlist,
  } = useApp()
  const { user: currentUser, setUser } = useAuth()
  const { addToast } = useNotifications()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      bio: '',
      campus: CAMPUS_OPTIONS[0],
    },
  })

  useEffect(() => {
    async function bootstrapProfile() {
      setLoading(true)
      setError('')
      try {
        const profileData = await profileApi.getProfile()
        const user = profileData?.user || null
        setProfile(user)
        reset({
          fullName: user?.fullName || '',
          bio: user?.bio || '',
          campus: user?.campus || CAMPUS_OPTIONS[0],
        })
      } catch {
        setError('Could not load profile')
      } finally {
        setLoading(false)
      }
    }
    bootstrapProfile()
  }, [reset])

  const myListings = useMemo(
    () => listings.filter((listing) => listing.sellerId === currentUser?.id),
    [listings, currentUser],
  )
  const myOrders = useMemo(
    () => transactions.filter((order) => order.buyerId === currentUser?.id),
    [transactions, currentUser],
  )
  const mySaved = useMemo(
    () =>
      listings.filter(
        (listing) => listing.isWishlisted && listing.sellerId !== currentUser?.id,
      ),
    [listings, currentUser],
  )

  const submitProfile = async (values) => {
    const response = await profileApi.updateProfile(values)
    setProfile(response.user)
    setUser(response.user)
    setIsEditOpen(false)
    addToast({ type: 'success', message: 'Profile updated' })
  }

  const uploadAvatar = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setProfile((previous) => ({ ...previous, avatar: reader.result }))
      addToast({ type: 'success', message: 'Profile photo updated' })
    }
    reader.readAsDataURL(file)
  }

  const submitTransactionReview = async (values) => {
    if (!reviewTarget) return
    await listingsApi.submitReview(reviewTarget.listingId || reviewTarget.id, values)
    addToast({ type: 'success', message: `Review submitted for ${reviewTarget.item}` })
  }

  const handleEditListing = (listingId) => {
    navigate(`/listings/${listingId}/edit`)
  }

  const handleDeleteListing = async (listingId) => {
    const shouldDelete = window.confirm('Delete this listing? This action cannot be undone.')
    if (!shouldDelete) return

    const deleted = await deleteListing(listingId)
    if (!deleted) return
    addToast({ type: 'success', message: 'Listing deleted' })
  }

  const handleUnsave = async (listingId) => {
    const nextState = await toggleWishlist(listingId)
    if (nextState === false) {
      addToast({ type: 'info', message: 'Removed from saved' })
    }
  }

  if (loading || isTransactionsLoading) return <Skeleton className="h-64 w-full" />

  if (error || !profile) {
    return <ErrorState title="Unable to load profile" description={error || 'Please refresh and try again.'} />
  }

  return (
    <div className="space-y-4">
      <ProfileHeader profile={profile} onEdit={() => setIsEditOpen(true)} onAvatarUpload={uploadAvatar} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_0.95fr]">
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">My Listings</h3>
          <div className="space-y-2">
            {myListings.map((listing) => (
              <div key={listing.id} className="rounded-xl border border-slate-100 p-3">
                <p className="text-sm font-medium text-slate-800">{listing.title}</p>
                <p className="text-xs text-slate-500">
                  {listing.campus} | {listing.status}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleEditListing(listing.id)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteListing(listing.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {myListings.length === 0 ? <p className="text-sm text-slate-500">No listings posted yet.</p> : null}
          </div>
          <p className="mt-3 text-xs text-slate-500">Total posted: {myListings.length}</p>
        </Card>

        <TransactionHistory title="My Orders" items={myOrders} onReview={setReviewTarget} />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">My Saved</h3>
          <Button variant="secondary" size="sm" onClick={() => navigate('/saved')}>
            Open Saved
          </Button>
        </div>
        <div className="space-y-2">
          {mySaved.slice(0, 4).map((listing) => (
            <div key={listing.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{listing.title}</p>
                <p className="text-xs text-slate-500">{listing.campus}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => navigate(`/listings/${listing.id}`)}>
                  View
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleUnsave(listing.id)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
          {mySaved.length === 0 ? <p className="text-sm text-slate-500">No saved listings yet.</p> : null}
        </div>
      </Card>

      {transactionsError ? <p className="text-sm text-rose-600">{transactionsError}</p> : null}

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Profile">
        <form className="space-y-3" onSubmit={handleSubmit(submitProfile)}>
          <Input label="Full Name" {...register('fullName')} error={errors.fullName?.message} />
          <Select
            label="Campus"
            {...register('campus')}
            options={CAMPUS_OPTIONS.map((campus) => ({ value: campus, label: campus }))}
            error={errors.campus?.message}
          />
          <label className="flex flex-col gap-1.5 text-sm text-slate-700">
            <span className="font-medium">Bio</span>
            <textarea
              className="input-base min-h-24 resize-none"
              {...register('bio')}
              placeholder="Tell other students about yourself"
            />
            {errors.bio?.message ? <span className="text-xs text-rose-600">{errors.bio.message}</span> : null}
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      <ReviewModal
        isOpen={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        onSubmit={submitTransactionReview}
      />
    </div>
  )
}

export default ProfilePage
