import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { ListingsGrid } from '@/components/listings/ListingsGrid';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function MyProductsPage() {
  const { user } = useAuth();
  const { listings, deleteListing } = useApp();
  const myListings = listings.filter(l => l.sellerId === user?.id);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <h1 className="font-display text-2xl font-bold text-center mb-4">My Products</h1>
      <ListingsGrid
        listings={myListings}
        currentUser={user}
        onEditListing={listing => window.location.href = `/listings/${listing.id}/edit`}
        onDeleteListing={deleteListing}
      />
      <Card className="mt-8 p-6">
        <h2 className="font-bold text-lg mb-2">Business Credentials</h2>
        <div className="flex flex-col gap-2">
          {user?.facebookLink && <a href={user.facebookLink} target="_blank" rel="noopener" className="text-blue-600">Facebook</a>}
          {user?.instagramLink && <a href={user.instagramLink} target="_blank" rel="noopener" className="text-pink-600">Instagram</a>}
          {user?.paymentLink && <a href={user.paymentLink} target="_blank" rel="noopener" className="text-green-600">Payment Method</a>}
        </div>
        <Button className="mt-4" onClick={() => window.location.href = '/profile'}>Edit Profile & Links</Button>
      </Card>
    </div>
  );
}
