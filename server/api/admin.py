from django.contrib import admin
from .models import Conversation, ConversationParticipant, Message, Notification, Profile, UniversityEmail

admin.site.register(Profile)
admin.site.register(UniversityEmail)
admin.site.register(Notification)
admin.site.register(Conversation)
admin.site.register(ConversationParticipant)
admin.site.register(Message)


# Register your models here.
