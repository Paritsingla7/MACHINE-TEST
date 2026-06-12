import django_filters
from .models import UserProfile

class UserProfileFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')
    state = django_filters.NumberFilter(field_name='state__id')
    gender = django_filters.CharFilter(field_name='gender', lookup_expr='iexact')

    class Meta:
        model = UserProfile
        fields = ['name', 'state', 'gender']