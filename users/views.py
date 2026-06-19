from django.db.models.functions import Lower
from rest_framework import request, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import OrderingFilter as _BaseOrderingFilter
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .serializers import UserProfileSerializer, StateSerializer, HobbySerializer
from .models import UserProfile, Cities, States, Hobbies
from .filters import UserProfileFilter
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.core.mail import send_mail
from django.conf import settings
from .models import PasswordResetToken
from django.contrib.auth.models import User

class OrderingFilter(_BaseOrderingFilter):
    _remap = {'state': 'state__name', 'city': 'city__name'}
    _ci    = {'name', 'email', 'state__name', 'city__name'}

    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)
        if not ordering:
            return queryset
        exprs = []
        for f in ordering:
            desc  = f.startswith('-')
            field = self._remap.get(f[1:] if desc else f, f[1:] if desc else f)
            if field in self._ci:
                exprs.append(Lower(field).desc() if desc else Lower(field))
            else:
                exprs.append(('-' + field) if desc else field)
        return queryset.order_by(*exprs)



class _Paginator(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class UserProfileView(APIView):
    @extend_schema(
        tags=['Users'],
        summary='Register a new user profile',
        request=UserProfileSerializer,
        responses={
            201: UserProfileSerializer,
            400: OpenApiTypes.OBJECT,
        },
    )
    def post(self, request):
        serializer = UserProfileSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
        profile = serializer.save()
        refresh = RefreshToken.for_user(profile.user)
    
        return Response({
            "user": serializer.data,
            "username": profile.user.username,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)


class UserListView(APIView):
    permission_classes = [IsAdminUser]
    ordering_fields = ['name', 'gender', 'birth_date', 'email', 'mobile', 'phone', 'state', 'city', 'created_at']
    ordering = ['-created_at']

    @extend_schema(
        tags=['Users'],
        summary='List user profiles',
        description=(
            'Returns a paginated list of user profiles (10 per page). '
            'Supports filtering by name/state/gender, ordering by any field, '
            'and sparse fieldsets via ?fields= to limit which fields are returned.'
        ),
        parameters=[
            OpenApiParameter(
                'name', OpenApiTypes.STR,
                description='Filter by name (case-insensitive partial match). E.g. ?na me=raj',
            ),
            OpenApiParameter(
                'state', OpenApiTypes.INT,
                description='Filter by state ID. E.g. ?state=2',
            ),
            OpenApiParameter(
                'gender', OpenApiTypes.STR,
                description='Filter by gender. Values: M (Male) or F (Female).',
            ),
            OpenApiParameter(
                'ordering', OpenApiTypes.STR,
                description=(
                    'Comma-separated fields to sort by. Prefix with - for descending. '
                    'Valid fields: name, gender, birth_date, email, mobile, phone, state, city, created_at. '
                    'Default: -created_at (newest first). '
                    'E.g. ?ordering=state,-name'
                ),
            ),
            OpenApiParameter(
                'page', OpenApiTypes.INT,
                description='Page number (default: 1). Each page returns 10 results.',
            ),
            OpenApiParameter(
                'fields', OpenApiTypes.STR,
                description=(
                    'Comma-separated field names to include in each result (sparse fieldset). '
                    'E.g. ?fields=id,name,state,created_at'
                ),
            ),
        ],
        responses={
            200: UserProfileSerializer(many=True),
            400: OpenApiTypes.OBJECT,
        },
    )
    def get(self, request):
        queryset = UserProfile.objects.select_related('state', 'city').prefetch_related('hobbies')

        filterset = UserProfileFilter(request.query_params, queryset=queryset)
        if not filterset.is_valid():
            return Response(
                {"errors": filterset.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        ordering_filter = OrderingFilter()
        queryset = ordering_filter.filter_queryset(request, filterset.qs, self)

        paginator = _Paginator()
        page = paginator.paginate_queryset(queryset, request)

        serializer = UserProfileSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)


class CitiesListView(APIView):
    @extend_schema(
        tags=['Locations'],
        summary='List cities for a state',
        description='Returns all cities belonging to the given state as a list of {id, name} objects.',
        parameters=[
            OpenApiParameter(
                'state_id', OpenApiTypes.INT, required=True,
                description='ID of the state whose cities to fetch.',
            ),
        ],
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
        },
    )
    def get(self, request):
        state_id = request.query_params.get('state_id')
        if not state_id:
            return Response(
                {"error": "state_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            state_id_int = int(state_id)
        except ValueError:
            return Response(
                {"error": "state_id must be a valid integer."},
                status=status.HTTP_400_BAD_REQUEST
            )
        cities = Cities.objects.filter(state_id=state_id_int)
        city_data = [{"id": city.id, "name": city.name} for city in cities] # type: ignore
        return Response(city_data, status=status.HTTP_200_OK)


class StateListView(APIView):
    @extend_schema(
        tags=['Locations'],
        summary='List all states',
        responses={200: StateSerializer(many=True)},
    )
    def get(self, request):
        states = States.objects.all()
        serializer = StateSerializer(states, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class HobbiesListView(APIView):
    @extend_schema(
        tags=['Locations'],
        summary='List all hobbies',
        responses={200: HobbySerializer(many=True)},
    )
    def get(self, request):
        hobbies = Hobbies.objects.all()
        serializer = HobbySerializer(hobbies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Users'],
        summary='Get your own profile',
        description='Returns the full profile of the currently authenticated user.',
        responses={200: UserProfileSerializer},
    )
    def get(self, request):
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            return Response({"error": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

from rest_framework_simplejwt.views import TokenObtainPairView as _TokenObtainPairView

class LoginView(_TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            from django.contrib.auth.models import User
            from rest_framework_simplejwt.tokens import AccessToken
            token = AccessToken(response.data['access'])
            user = User.objects.get(id=token['user_id'])
            response.data['is_admin'] = user.is_superuser
            response.data['username'] = user.username
        return response

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not user.check_password(old_password):
            return Response({"error": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        if not new_password or len(new_password) < 8:
            return Response({"error": "New password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)
        if new_password != confirm_password:
            return Response({"error": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)
        if old_password == new_password:
            return Response({"error": "New password cannot be the same as current password."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile = UserProfile.objects.get(email=email)
        except UserProfile.DoesNotExist:
            # Vague on purpose — don't reveal if email exists
            return Response({"message": "If an account with that email exists, a reset link has been sent."}, status=status.HTTP_200_OK)

        user = profile.user
        if user is None:
            return Response({"message": "If an account with that email exists, a reset link has been sent."}, status=status.HTTP_200_OK)

        # Invalidate any existing unused tokens for this user
        PasswordResetToken.objects.filter(user=user, is_used=False).delete()

        reset_token = PasswordResetToken.objects.create(user=user)

        reset_link = f"{settings.SITE_URL}/reset-password/?token={reset_token.token}"

        send_mail(
            subject="Reset your password",
            message=f"Click the link to reset your password. It expires in 15 minutes.\n\n{reset_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )

        return Response({"message": "If an account with that email exists, a reset link has been sent."}, status=status.HTTP_200_OK)


class ForgotPasswordConfirmView(APIView):

    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not token:
            return Response({"error": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not new_password or len(new_password) < 8:
            return Response({"error": "Password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)
        if new_password != confirm_password:
            return Response({"error": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reset_token = PasswordResetToken.objects.get(token=token, is_used=False)
        except PasswordResetToken.DoesNotExist:
            return Response({"error": "Invalid or already used token."}, status=status.HTTP_400_BAD_REQUEST)

        if reset_token.is_expired():
            reset_token.delete()
            return Response({"error": "Token has expired. Please request a new reset link."}, status=status.HTTP_400_BAD_REQUEST)

        user = reset_token.user
        user.set_password(new_password)
        user.save()

        reset_token.is_used = True
        reset_token.save()

        return Response({"message": "Password reset successfully. You can now log in."}, status=status.HTTP_200_OK)

