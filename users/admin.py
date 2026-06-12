from django.contrib import admin

# Register your models here.
from .models import UserProfile, States, Cities

admin.site.register(UserProfile)
admin.site.register(States)
admin.site.register(Cities)
