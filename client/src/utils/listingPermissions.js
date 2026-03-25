export function getListingPermissions(listing, currentUser) {
  const safeCurrentUser = currentUser || { id: '' }
  const isLoggedIn = Boolean(currentUser)
  const isOwner = String(listing.sellerId) === String(safeCurrentUser.id)
  const isAvailable = listing.status === 'AVAILABLE'

  return {
    isLoggedIn,
    isOwner,
    isAvailable,
    canBuyOrOffer: isLoggedIn && !isOwner && isAvailable,
    canMessageSeller: isLoggedIn && !isOwner,
  }
}
