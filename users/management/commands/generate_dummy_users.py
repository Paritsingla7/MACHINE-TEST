import random
import string
from datetime import date, timedelta

from django.core.management.base import BaseCommand, CommandError

from users.models import UserProfile, States, Cities


FIRST_NAMES_M = [
    'Aarav', 'Arjun', 'Rohit', 'Vikram', 'Karan', 'Rahul', 'Nikhil', 'Amit',
    'Sanjay', 'Deepak', 'Suresh', 'Ramesh', 'Manish', 'Vivek', 'Aditya',
    'Kunal', 'Harsh', 'Piyush', 'Gaurav', 'Ankit', 'Ritesh', 'Siddharth',
    'Pranav', 'Yash', 'Dev', 'Ishaan', 'Kabir', 'Rohan', 'Tushar', 'Varun',
]

FIRST_NAMES_F = [
    'Priya', 'Sneha', 'Pooja', 'Neha', 'Anjali', 'Riya', 'Divya', 'Kavya',
    'Meera', 'Shreya', 'Ananya', 'Nisha', 'Sonal', 'Isha', 'Tanvi',
    'Aditi', 'Simran', 'Pallavi', 'Komal', 'Swati', 'Ritika', 'Preeti',
    'Deepika', 'Aishwarya', 'Radhika', 'Nandini', 'Sakshi', 'Tanya', 'Vrinda', 'Zara',
]

LAST_NAMES = [
    'Sharma', 'Verma', 'Singh', 'Patel', 'Gupta', 'Kumar', 'Mehta', 'Joshi',
    'Malhotra', 'Kapoor', 'Chauhan', 'Yadav', 'Tiwari', 'Mishra', 'Pandey',
    'Rao', 'Reddy', 'Nair', 'Pillai', 'Iyer', 'Bhat', 'Kulkarni', 'Desai',
    'Shah', 'Jain', 'Agarwal', 'Bansal', 'Saxena', 'Srivastava', 'Trivedi',
]

HOBBIES = ['hockey', 'chess', 'football', 'cricket']

DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com']


def random_phone(existing):
    for _ in range(100):
        number = '9' + ''.join(random.choices(string.digits, k=9))
        if number not in existing:
            existing.add(number)
            return number
    raise CommandError('Could not generate a unique phone number after 100 attempts.')


def random_dob():
    today = date.today()
    days_in_range = (60 - 18) * 365
    offset = random.randint(18 * 365, 60 * 365)
    return today - timedelta(days=offset)


class Command(BaseCommand):
    help = 'Generate dummy UserProfile records for testing.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count', type=int, default=20,
            help='Number of dummy users to create (default: 20)',
        )

    def handle(self, *args, **options):
        count = options['count']

        states = list(States.objects.prefetch_related('cities_set').all())
        if not states:
            raise CommandError(
                'No states found in the database. '
                'Please populate the States and Cities tables first.'
            )

        # Build state → cities map, skip states with no cities
        state_city_map = {}
        for state in states:
            cities = list(Cities.objects.filter(state=state))
            if cities:
                state_city_map[state] = cities

        if not state_city_map:
            raise CommandError('No cities found. Populate Cities before generating users.')

        # Collect existing phone/mobile numbers to avoid duplicates
        existing_numbers = set(
            UserProfile.objects.values_list('phone', flat=True)
        ) | set(
            UserProfile.objects.values_list('mobile', flat=True)
        )
        existing_numbers.discard('')

        created = 0
        skipped = 0

        for i in range(count):
            gender = random.choice(['M', 'F'])
            first = random.choice(FIRST_NAMES_M if gender == 'M' else FIRST_NAMES_F)
            last = random.choice(LAST_NAMES)
            name = f'{first} {last}'
            if len(name) > 25:
                name = name[:25]

            dob = random_dob()

            # ~70% chance of having an email
            email = ''
            if random.random() < 0.7:
                email = f'{first.lower()}.{last.lower()}{random.randint(1, 999)}@{random.choice(DOMAINS)}'
                if len(email) > 254:
                    email = ''

            # Randomly assign phone, mobile, or both
            contact_choice = random.choice(['phone', 'mobile', 'both'])
            phone = ''
            mobile = ''
            try:
                if contact_choice in ('phone', 'both'):
                    phone = random_phone(existing_numbers)
                if contact_choice in ('mobile', 'both'):
                    mobile = random_phone(existing_numbers)
            except CommandError as e:
                self.stderr.write(str(e))
                skipped += 1
                continue

            state = random.choice(list(state_city_map.keys()))
            city = random.choice(state_city_map[state])

            hobbies = random.sample(HOBBIES, k=random.randint(0, len(HOBBIES)))

            try:
                UserProfile.objects.create(
                    name=name,
                    gender=gender,
                    birth_date=dob,
                    email=email,
                    phone=phone,
                    mobile=mobile,
                    state=state,
                    city=city,
                    hobbies=hobbies,
                )
                created += 1
            except Exception as e:
                self.stderr.write(f'Row {i+1} skipped: {e}')
                skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done. Created {created} users. Skipped {skipped}.'
        ))
