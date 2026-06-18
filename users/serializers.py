from rest_framework import serializers
from .models import Cities, Hobbies, UserProfile, States
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from datetime import date
from django.db.models import Q

class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = States
        fields = ['id', 'name']

class HobbySerializer(serializers.ModelSerializer):
    class Meta:
        model = Hobbies
        fields = ['id', 'name']

class UserProfileSerializer(serializers.ModelSerializer):
    
    name = serializers.CharField()

    # READ: returns name strings
    state = serializers.StringRelatedField(read_only=True)
    city = serializers.StringRelatedField(read_only=True)
    hobbies = HobbySerializer(many=True, read_only=True)
    
    # WRITE: accepts IDs
    state_id = serializers.PrimaryKeyRelatedField(
        queryset=States.objects.all(), source='state', write_only=True
    )
    city_id = serializers.PrimaryKeyRelatedField(
        queryset=Cities.objects.all(), source='city', 
        write_only=True, required=False, allow_null=True
    )
    hobbies_ids = serializers.SlugRelatedField(
        queryset=Hobbies.objects.all(), source='hobbies',
        slug_field='name', many=True, write_only=True, required=False
    )

    class Meta:
        
        model = UserProfile
        fields = ['id', 'name', 'mobile', 'phone', 'photo', 'gender',
                  'state', 'city', 'hobbies',           # read
                  'state_id', 'city_id', 'hobbies_ids', # write
                  'email', 'birth_date', 'created_at']

    def create(self, validated_data):
        hobbies = validated_data.pop('hobbies', [])
        instance = UserProfile.objects.create(**validated_data)
        instance.hobbies.set(hobbies)
        return instance

    def to_representation(self, instance):
        request = self.context.get('request')
        representation = super().to_representation(instance)
        
        if request:
            fields = request.query_params.get('fields')
            if fields:
                allowed = [f.strip() for f in fields.split(',')]
                return {k: v for k, v in representation.items() if k in allowed}
        
        return representation
    
    def validate_name(self, value):
        return value.strip()

    def validate_email(self, value):
        # treat empty string as no email provided
        return None if value == '' else value

    def validate(self, data):
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
        hobbies = data.get('hobbies')

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
        if photo and photo.name.split('.')[-1].lower() not in ['jpg', 'jpeg', 'png']:
            error['photo'] = 'Photo must be in JPG or PNG format.'
        
        #gender validation
        if gender not in ['M', 'F']:
            error['gender'] = 'Gender must be either "M" for male or "F" for female'
        
        #state and city validation
        if not state:
            error['state'] = 'State must be selected.'
        if city and state and city.state != state:
            error['city'] = 'City must belong to the selected state.'

        #email format validation + uniqueness
        if email:
            try:
                validate_email(email)
            except ValidationError:
                error['email'] = 'Invalid email format.'
            else:
                existing = UserProfile.objects
                if self.instance:
                    existing = existing.exclude(pk=self.instance.pk)
                if existing.filter(email=email).exists():
                    error['email'] = 'This email address is already registered.'

        #birth_date validation
        if birth_date and birth_date > date.today():
            error['birth_date'] = 'Birth date cannot be in the future.'

        if error:
            raise serializers.ValidationError(error)
        else: 
            return data
        

