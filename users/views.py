from django.db.models.functions import Lower
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import OrderingFilter as _BaseOrderingFilter
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .serializers import UserProfileSerializer, StateSerializer
from .models import UserProfile, Cities, States
from .filters import UserProfileFilter


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
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UserListView(APIView):
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
                description='Filter by name (case-insensitive partial match). E.g. ?name=raj',
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
        if not state_id.isdigit():
            return Response(
                {"error": "state_id must be a valid integer."},
                status=status.HTTP_400_BAD_REQUEST
            )
        cities = Cities.objects.filter(state_id=state_id)
        city_data = [{"id": city.id, "name": city.name} for city in cities]
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
