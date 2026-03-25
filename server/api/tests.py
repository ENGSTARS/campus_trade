from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import ConversationParticipant, Message, Notification
from listings.models import Listing


class NotificationFlowTests(APITestCase):
    def setUp(self):
        self.seller = User.objects.create_user(
            username="seller@campus.edu",
            email="seller@campus.edu",
            password="pass12345",
        )
        self.buyer = User.objects.create_user(
            username="buyer@campus.edu",
            email="buyer@campus.edu",
            password="pass12345",
        )
        self.seller.profile.full_name = "Seller Student"
        self.seller.profile.save()
        self.buyer.profile.full_name = "Buyer Student"
        self.buyer.profile.save()
        self.listing = Listing.objects.create(
            seller=self.seller,
            title="Desk Lamp",
            description="Warm light desk lamp",
            price="25.00",
            category="Furniture",
            campus="Main Campus",
            condition="Good",
            type="SECOND_HAND",
            quantity=2,
            status="AVAILABLE",
        )

    def test_order_creation_creates_seller_notification(self):
        self.client.force_authenticate(user=self.buyer)

        response = self.client.post(f"/api/listings/{self.listing.id}/order/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification = Notification.objects.get(recipient=self.seller)
        self.assertEqual(notification.title, "New order placed")
        self.assertIn("Buyer Student", notification.body)
        self.assertIn(self.listing.title, notification.body)

    def test_notifications_can_be_listed_and_marked_read(self):
        notification = Notification.objects.create(
            recipient=self.seller,
            title="New order placed",
            body="Buyer Student placed an order for Desk Lamp.",
        )
        self.client.force_authenticate(user=self.seller)

        list_response = self.client.get("/api/notifications")
        mark_one_response = self.client.patch(f"/api/notifications/{notification.id}/read")
        mark_all_response = self.client.patch("/api/notifications/read-all")

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data["items"][0]["id"], notification.id)
        self.assertFalse(list_response.data["items"][0]["isRead"])
        self.assertEqual(mark_one_response.status_code, status.HTTP_200_OK)
        self.assertTrue(mark_one_response.data["isRead"])
        self.assertEqual(mark_all_response.status_code, status.HTTP_200_OK)

        notification.refresh_from_db()
        self.assertTrue(notification.is_read)


class MessagingFlowTests(APITestCase):
    def setUp(self):
        self.seller = User.objects.create_user(
            username="seller2@campus.edu",
            email="seller2@campus.edu",
            password="pass12345",
        )
        self.buyer = User.objects.create_user(
            username="buyer2@campus.edu",
            email="buyer2@campus.edu",
            password="pass12345",
        )
        self.seller.profile.full_name = "Seller Two"
        self.seller.profile.save()
        self.buyer.profile.full_name = "Buyer Two"
        self.buyer.profile.save()
        self.listing = Listing.objects.create(
            seller=self.seller,
            title="Monitor Stand",
            description="Adjustable stand",
            price="18.00",
            category="Furniture",
            campus="Main Campus",
            condition="Good",
            type="SECOND_HAND",
            quantity=1,
            status="AVAILABLE",
        )

    def test_conversation_can_be_created_and_message_sent(self):
        self.client.force_authenticate(user=self.buyer)

        create_response = self.client.post(
            "/api/messaging/conversations",
            {"participantId": self.seller.id, "listingId": self.listing.id},
            format="json",
        )
        conversation_id = create_response.data["item"]["id"]
        send_response = self.client.post(
            f"/api/messaging/conversations/{conversation_id}",
            {"message": "Hi, is pickup tomorrow okay?"},
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_200_OK)
        self.assertEqual(send_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.filter(conversation_id=conversation_id).count(), 1)
        seller_link = ConversationParticipant.objects.get(conversation_id=conversation_id, user=self.seller)
        self.assertEqual(seller_link.unread_count, 1)

    def test_seller_can_list_and_read_messages(self):
        self.client.force_authenticate(user=self.buyer)
        create_response = self.client.post(
            "/api/messaging/conversations",
            {"participantId": self.seller.id, "listingId": self.listing.id},
            format="json",
        )
        conversation_id = create_response.data["item"]["id"]
        self.client.post(
            f"/api/messaging/conversations/{conversation_id}",
            {"message": "Hello seller"},
            format="json",
        )

        self.client.force_authenticate(user=self.seller)
        list_response = self.client.get("/api/messaging/conversations")
        detail_response = self.client.get(f"/api/messaging/conversations/{conversation_id}")

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data["items"][0]["participantId"], self.buyer.id)
        self.assertEqual(detail_response.data["items"][0]["message"], "Hello seller")
        self.assertFalse(detail_response.data["items"][0]["fromMe"])

        seller_link = ConversationParticipant.objects.get(conversation_id=conversation_id, user=self.seller)
        self.assertEqual(seller_link.unread_count, 0)

    def test_participant_can_delete_conversation(self):
        self.client.force_authenticate(user=self.buyer)
        create_response = self.client.post(
            "/api/messaging/conversations",
            {"participantId": self.seller.id, "listingId": self.listing.id},
            format="json",
        )
        conversation_id = create_response.data["item"]["id"]
        self.client.post(
            f"/api/messaging/conversations/{conversation_id}",
            {"message": "Delete this thread"},
            format="json",
        )

        delete_response = self.client.delete(f"/api/messaging/conversations/{conversation_id}")

        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)
        self.assertFalse(Message.objects.filter(conversation_id=conversation_id).exists())
        self.assertFalse(ConversationParticipant.objects.filter(conversation_id=conversation_id).exists())
