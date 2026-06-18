from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserProfileView, UserListView, CitiesListView, StateListView, HobbiesListView, UserMeView, LoginView

urlpatterns = [
    path('register/', UserProfileView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', UserMeView.as_view(), name='profile'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('cities/', CitiesListView.as_view(), name='cities-list'),
    path('states/', StateListView.as_view(), name='states-list'),
    path('hobbies/', HobbiesListView.as_view(), name='hobbies-list'),
]