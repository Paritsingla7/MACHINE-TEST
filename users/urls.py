from django.urls import path
from .views import UserProfileView, UserListView

urlpatterns = [
    path('register/', UserProfileView.as_view(), name='register'),
    path('users/', UserListView.as_view(), name='user-list'),
]