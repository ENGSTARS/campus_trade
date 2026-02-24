export function getListingPermissions(listing, currentUser) {
  const safeCurrentUser = currentUser || { id: '' }
  const isLoggedIn = Boolean(currentUser)
  const isOwner = listing.sellerId === safeCurrentUser.id
  const isAvailable = listing.status === 'AVAILABLE'
  const isSecondHand = listing.type === 'SECOND_HAND'
  const isNew = listing.type === 'NEW'

  return {
    isLoggedIn,
    isOwner,
    isAvailable,
    isSecondHand,
    isNew,
    canBuyOrOffer: isLoggedIn && !isOwner && isAvailable,
    canMessageSeller: isLoggedIn && !isOwner,
  }
}
