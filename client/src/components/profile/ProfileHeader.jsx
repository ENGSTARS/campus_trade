import { getInitials } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'

export function ProfileHeader({ profile, onEdit, onAvatarUpload }) {
  return (
    <section className="card-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.fullName} className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
            {getInitials(profile.fullName)}
          </div>
        )}
        <div>
          <p className="text-lg font-semibold text-slate-900">{profile.fullName}</p>
          <p className="text-sm text-slate-600">{profile.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-slate-500">Campus: {profile.campus}</span>
            <span className="badge-base bg-amber-100 text-amber-700">Rating * {profile.rating}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="btn-secondary cursor-pointer">
          Upload Photo
          <input className="hidden" type="file" accept="image/*" onChange={onAvatarUpload} />
        </label>
        <Button variant="secondary" onClick={onEdit}>
          Edit Profile
        </Button>
      </div>
    </section>
  )
}
