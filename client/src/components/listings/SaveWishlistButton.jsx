import { useApp } from '@/context/AppContext'

export function SaveWishlistButton({ listingId, isWishlisted, disabled = false }) {
  const { toggleWishlist } = useApp()

  return (
    <button
      onClick={() => toggleWishlist(listingId)}
      disabled={disabled}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Save to wishlist"
    >
      {isWishlisted ? 'Saved' : 'Save'}
    </button>
  )
}
