from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserProfileView, UserListView, CitiesListView, StateListView, UserMeView, LoginView

urlpatterns = [
    path('register/', UserProfileView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', UserMeView.as_view(), name='me'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('cities/', CitiesListView.as_view(), name='cities-list'),
    path('states/', StateListView.as_view(), name='states-list'),
]