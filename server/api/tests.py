import io
import tempfile
from pathlib import Path

from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Conversation, ConversationParticipant, Message, Notification, UniversityEmail
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


class RegistrationFlowTests(APITestCase):
    def setUp(self):
        UniversityEmail.objects.create(
            email="freshstudent@campustrade.edu",
            full_name="Fresh Student",
            campus="Main Campus",
        )

    def test_registration_works_for_approved_university_email(self):
        response = self.client.post(
            "/api/register/",
            {
                "email": "freshstudent@campustrade.edu",
                "password": "pass12345",
                "confirm_password": "pass12345",
                "full_name": "Fresh Student",
                "campus": "Main Campus",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_user = User.objects.get(email="freshstudent@campustrade.edu")
        self.assertEqual(created_user.profile.full_name, "Fresh Student")
        self.assertEqual(created_user.profile.campus, "Main Campus")

    def test_registration_rejects_unapproved_email(self):
        response = self.client.post(
            "/api/register/",
            {
                "email": "outsider@campustrade.edu",
                "password": "pass12345",
                "confirm_password": "pass12345",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["email"][0], "You are not a university student")


class ProfileFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="profile@campus.edu",
            email="profile@campus.edu",
            password="pass12345",
        )

    def test_profile_can_be_updated(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.put(
            "/api/me/",
            {
                "full_name": "Updated Student",
                "bio": "CS student",
                "campus": "Main Campus",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.full_name, "Updated Student")
        self.assertEqual(self.user.profile.bio, "CS student")
        self.assertEqual(self.user.profile.campus, "Main Campus")


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

    def test_conversation_can_be_created(self):
        self.client.force_authenticate(user=self.buyer)

        create_response = self.client.post(
            "/api/messaging/conversations",
            {"participantId": self.seller.id, "listingId": self.listing.id},
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            ConversationParticipant.objects.filter(
                conversation_id=create_response.data["item"]["id"],
                user=self.buyer,
            ).exists()
        )
        self.assertTrue(
            ConversationParticipant.objects.filter(
                conversation_id=create_response.data["item"]["id"],
                user=self.seller,
            ).exists()
        )

    def test_message_can_be_sent(self):
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
        self.assertFalse(
            ConversationParticipant.objects.filter(conversation_id=conversation_id, user=self.buyer).exists()
        )
        self.assertTrue(
            ConversationParticipant.objects.filter(conversation_id=conversation_id, user=self.seller).exists()
        )
        self.assertTrue(Conversation.objects.filter(pk=conversation_id).exists())


class SeedUniversityEmailsCommandTests(TestCase):
    def test_command_creates_emails_from_flags(self):
        stdout = io.StringIO()

        call_command(
            "seed_university_emails",
            "--email",
            "student1@campustrade.edu",
            "--email",
            "student2@campustrade.edu",
            "--campus",
            "Main Campus",
            stdout=stdout,
        )

        self.assertTrue(UniversityEmail.objects.filter(email="student1@campustrade.edu", campus="Main Campus").exists())
        self.assertTrue(UniversityEmail.objects.filter(email="student2@campustrade.edu", campus="Main Campus").exists())
        self.assertIn("Created: 2", stdout.getvalue())

    def test_command_updates_existing_rows_from_csv(self):
        UniversityEmail.objects.create(
            email="existing@campustrade.edu",
            full_name="Old Name",
            campus="Old Campus",
        )

        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8") as handle:
            handle.write("email,full_name,campus\n")
            handle.write("existing@campustrade.edu,Updated Name,Main Campus\n")
            csv_path = handle.name

        try:
            call_command("seed_university_emails", "--file", csv_path, "--update-existing")
        finally:
            Path(csv_path).unlink(missing_ok=True)

        seeded = UniversityEmail.objects.get(email="existing@campustrade.edu")
        self.assertEqual(seeded.full_name, "Updated Name")
        self.assertEqual(seeded.campus, "Main Campus")
