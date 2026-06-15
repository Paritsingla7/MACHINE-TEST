from rest_framework import serializers
from .models import UserProfile, States
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from datetime import date
from django.db.models import Q

class UserProfileSerializer(serializers.ModelSerializer):
    
    name = serializers.CharField()

    class Meta:
        
        model = UserProfile
        fields = '__all__'

    def validate_name(self, value):
        return value

    def validate(self, data ):
        error = {}
        
        name = data.get('name', '').strip()
        mobile = data.get('mobile')
        phone = data.get('phone')
        photo = data.get('photo')
        gender = data.get('gender')
        state = data.get('state')
        city = data.get('city')
        email = data.get('email')
        birth_date = data.get('birth_date')

        #mobile/phone validation
        if not phone and not mobile:
            error['contact'] = 'At least one contact number (phone or mobile) must be provided.'
        else:
            if phone:
                if not phone.isdigit():
                    error['phone'] = 'Phone number must contain only digits.'
                elif len(phone) != 10:
                    error['phone'] = 'Phone number must be 10 digits long.'
            if mobile:
                if not mobile.isdigit():
                    error['mobile'] = 'Mobile number must contain only digits.'
                elif len(mobile) != 10:
                    error['mobile'] = 'Mobile number must be 10 digits long.'

        existing = UserProfile.objects
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if mobile and existing.filter(Q(mobile=mobile) | Q(phone=mobile)).exists():
            error['mobile'] = 'This mobile number is already registered.'
        if phone and existing.filter(Q(phone=phone) | Q(mobile=phone)).exists():
            error['phone'] = 'This phone number is already registered.'

        #name validation
        if not name:
            error['name'] = 'Name cannot be empty.'
        else:
            if len(name) > 25:
                error['name'] = 'Name cannot exceed 25 characters.'
        
        #photo validation
        if photo and photo.name.split('.')[-1].lower()  not in ['jpg', 'png']:
            error['photo'] = 'Photo must be in JPG or PNG format.'
        
        #gender validation
        if gender not in ['M', 'F']:
            error['gender'] = 'Gender must be either "M" for male or "F" for female'
        
        #state and city validation
        if not state:
            error['state'] = 'State must be selected.'
        if city and state and city.state != state:
            error['city'] = 'City must belong to the selected state.'

        #email format validation
        if email:
            try:
                validate_email(email)
            except ValidationError:
                error['email'] = 'Invalid email format.'

        #birth_date validation
        if birth_date and birth_date > date.today():
            error['birth_date'] = 'Birth date cannot be in the future.'

        if error :
            raise serializers.ValidationError(error)
        else: 
            return data
        
class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = States
        fields = ['id', 'name']


