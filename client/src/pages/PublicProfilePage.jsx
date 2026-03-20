import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { profileApi } from '@/api/profileApi'
import { listingsApi } from '@/api/listingsApi'
import { useAuth } from '@/context/AuthContext'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ListingsGrid } from '@/components/listings/ListingsGrid'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

function PublicProfilePage() {
  const { userId } = useParams()
  const { isAdmin } = useAuth()
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPublicProfile() {
      setLoading(true)
      setError('')
      try {
        const profileData = isAdmin
          ? await profileApi.getAdminUserProfile(userId)
          : await profileApi.getPublicProfile(userId)
        setProfile(profileData.user)
        const listingsData = await listingsApi.getListings({
          sellerId: userId,
          ...(isAdmin ? { includeInactive: true } : {}),
        })
        setListings(listingsData.items)
      } catch {
        setError('Could not load profile')
      } finally {
        setLoading(false)
      }
    }
    if (userId) {
      loadPublicProfile()
    }
  }, [userId, isAdmin])

  if (loading) return <Skeleton className="h-64 w-full" />

  if (error || !profile) {
    return <ErrorState title="Unable to load profile" description={error || 'Please refresh and try again.'} />
  }

  return (
    <div className="space-y-4">
      <ProfileHeader profile={profile} />
      {isAdmin ? (
        <Card className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin Inspection</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Account Overview</h2>
          </div>
          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{profile.accountStatus || 'Active'}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Active Listings</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{profile.activeListings ?? listings.length}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Inventory Units</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{profile.inventoryUnits ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Sold Out Listings</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{profile.soldOutListings ?? 0}</p>
            </div>
          </div>
        </Card>
      ) : null}
      <h2 className="text-xl font-bold text-slate-900">Listings from {profile.fullName}</h2>
      <ListingsGrid listings={listings} />
    </div>
  )
}

export default PublicProfilePage
