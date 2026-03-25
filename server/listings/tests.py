from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from listings.models import Listing, Order


class ListingMutationTests(APITestCase):
    def setUp(self):
        self.seller = User.objects.create_user(
            username="seller3@campus.edu",
            email="seller3@campus.edu",
            password="pass12345",
        )
        self.buyer = User.objects.create_user(
            username="buyer3@campus.edu",
            email="buyer3@campus.edu",
            password="pass12345",
        )
        self.listing = Listing.objects.create(
            seller=self.seller,
            title="Desk Chair",
            description="Comfortable chair",
            price="55.00",
            category="Furniture",
            campus="Main Campus",
            condition="Good",
            type="SECOND_HAND",
            quantity=1,
            status="AVAILABLE",
        )

    def test_delete_listing_is_soft_delete(self):
        self.client.force_authenticate(user=self.seller)

        delete_response = self.client.delete(f"/api/listings/{self.listing.id}/")
        list_response = self.client.get("/api/listings/")
        mine_response = self.client.get("/api/listings/mine/")

        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.listing.refresh_from_db()
        self.assertFalse(self.listing.is_active)
        self.assertFalse(any(item["id"] == self.listing.id for item in list_response.data))
        self.assertFalse(any(item["id"] == self.listing.id for item in mine_response.data))

    def test_seller_can_delete_sold_listing(self):
        self.listing.quantity = 0
        self.listing.status = "SOLD"
        self.listing.save(update_fields=["quantity", "status"])
        self.client.force_authenticate(user=self.seller)

        response = self.client.delete(f"/api/listings/{self.listing.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.listing.refresh_from_db()
        self.assertFalse(self.listing.is_active)

    def test_non_owner_cannot_delete_listing(self):
        self.client.force_authenticate(user=self.buyer)

        response = self.client.delete(f"/api/listings/{self.listing.id}/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        error_message = response.data["error"]
        if isinstance(error_message, list):
            error_message = error_message[0]
        self.assertEqual(str(error_message), "You can only modify your own listings.")

    def test_ordering_last_unit_marks_listing_sold(self):
        self.client.force_authenticate(user=self.buyer)

        response = self.client.post(f"/api/listings/{self.listing.id}/order/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.listing.refresh_from_db()
        self.assertEqual(self.listing.quantity, 0)
        self.assertEqual(self.listing.status, "SOLD")
        self.assertEqual(Order.objects.filter(listing=self.listing, buyer=self.buyer).count(), 1)

    def test_order_rejected_when_listing_is_sold_out(self):
        self.listing.quantity = 0
        self.listing.status = "AVAILABLE"
        self.listing.save(update_fields=["quantity", "status"])
        self.client.force_authenticate(user=self.buyer)

        response = self.client.post(f"/api/listings/{self.listing.id}/order/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "This item is out of stock.")
        self.listing.refresh_from_db()
        self.assertEqual(self.listing.status, "SOLD")

    def test_same_buyer_can_place_multiple_orders_while_stock_remains(self):
        self.listing.quantity = 2
        self.listing.save(update_fields=["quantity"])
        self.client.force_authenticate(user=self.buyer)

        first_response = self.client.post(f"/api/listings/{self.listing.id}/order/")
        second_response = self.client.post(f"/api/listings/{self.listing.id}/order/")

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.listing.refresh_from_db()
        self.assertEqual(Order.objects.filter(listing=self.listing, buyer=self.buyer).count(), 2)
        self.assertEqual(self.listing.quantity, 0)
        self.assertEqual(self.listing.status, "SOLD")

    def test_reserved_status_rejected_when_quantity_is_more_than_one(self):
        self.listing.quantity = 2
        self.listing.save(update_fields=["quantity"])
        self.client.force_authenticate(user=self.seller)

        response = self.client.patch(
            f"/api/listings/{self.listing.id}/status/",
            {"status": "RESERVED"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Reserved status is only allowed when quantity is exactly 1.")

    def test_listing_update_rejects_reserved_status_when_quantity_is_more_than_one(self):
        self.client.force_authenticate(user=self.seller)

        response = self.client.patch(
            f"/api/listings/{self.listing.id}/",
            {"quantity": 2, "status": "RESERVED"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        status_error = response.data["status"]
        if isinstance(status_error, list):
            status_error = status_error[0]
        self.assertEqual(str(status_error), "Reserved status is only allowed when quantity is exactly 1.")

    def test_restocking_sold_listing_normalizes_it_to_available(self):
        self.listing.quantity = 0
        self.listing.status = "SOLD"
        self.listing.save(update_fields=["quantity", "status"])
        self.client.force_authenticate(user=self.seller)

        response = self.client.patch(
            f"/api/listings/{self.listing.id}/",
            {"quantity": 10},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.listing.refresh_from_db()
        self.assertEqual(self.listing.quantity, 10)
        self.assertEqual(self.listing.status, "AVAILABLE")
