from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .serializers import UserProfileSerializer, StateSerializer
from .models import UserProfile, Cities, States
from .filters import UserProfileFilter


class UserProfileView(APIView):
    @extend_schema(request=UserProfileSerializer, responses={201: UserProfileSerializer})
    def post(self, request):
        serializer = UserProfileSerializer(data=request.data)
        try:
             serializer.is_valid()
             serializer.save()
             return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserListView(APIView):
    @extend_schema(
        parameters=[
            OpenApiParameter('name', OpenApiTypes.STR, description='Filter by name (case-insensitive)'),
            OpenApiParameter('state', OpenApiTypes.INT, description='Filter by state ID'),
            OpenApiParameter('gender', OpenApiTypes.STR, description='Filter by gender (M or F)'),
            OpenApiParameter('page', OpenApiTypes.INT, description='Page number'),
        ],
        responses={200: UserProfileSerializer(many=True)},
    )
    def get(self, request):
        queryset = UserProfile.objects.all()
        filterset = UserProfileFilter(request.query_params, queryset=queryset)
        if not filterset.is_valid():
            return Response(
                {"errors": filterset.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        paginator = PageNumberPagination()
        paginator.page_size = 10
        page = paginator.paginate_queryset(filterset.qs, request)

        serializer = UserProfileSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

class CitiesListView(APIView):
    @extend_schema(
        parameters=[
            OpenApiParameter('state_id', OpenApiTypes.INT, required=True, description='ID of the state to fetch cities for'),
        ],
        responses={200: OpenApiTypes.OBJECT},
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
    @extend_schema(responses={200: StateSerializer(many=True)})
    def get(self, request):
        states = States.objects.all()
        serializer = StateSerializer(states, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
