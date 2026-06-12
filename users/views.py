from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserProfileSerializer
from .models import UserProfile
from .filters import UserProfileFilter
from rest_framework.pagination import PageNumberPagination

# Create your views here.
class UserProfileView(APIView):
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