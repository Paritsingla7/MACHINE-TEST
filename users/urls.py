from django.urls import path
from .views import UserProfileView, UserListView, CitiesListView, StateListView

urlpatterns = [
    path('register/', UserProfileView.as_view(), name='register'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('cities/', CitiesListView.as_view(), name='cities-list'),
    path('states/', StateListView.as_view(), name='states-list'),
]

