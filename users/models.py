from django.db import models
from django.contrib.auth.models import User
from multiselectfield import MultiSelectField


# Create your models here.
class States(models.Model):
    name = models.CharField(max_length=50, blank=False)
    def __str__(self):
        return self.name
    
class Cities(models.Model):
    name = models.CharField(max_length=50, blank=False)
    state = models.ForeignKey(States, on_delete=models.CASCADE, null=True, blank=True)
    def __str__(self):
        return self.name

class UserProfile(models.Model):
    name = models.CharField(max_length=25, blank=False)
    class genderChoices(models.TextChoices):
        MALE = 'M', 'Male'
        FEMALE = 'F', 'Female'

    gender = models.CharField(max_length=1, choices=genderChoices.choices)
    birth_date = models.DateField(blank=False)
    email = models.EmailField(max_length=254, blank=True)
    phone = models.CharField(max_length=10, blank=True)
    mobile = models.CharField(max_length=10, blank=True)
    state = models.ForeignKey('States', on_delete=models.CASCADE, blank=False, null=False)
    city = models.ForeignKey('Cities', on_delete=models.SET_NULL, blank=True, null=True) 
    hobbies = MultiSelectField(max_length=200, choices=[
        ('hockey', 'Hockey'),
        ('chess', 'Chess'),
        ('football', 'Football'),
        ('cricket', 'Cricket'),
    ], blank=True)

    photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)


