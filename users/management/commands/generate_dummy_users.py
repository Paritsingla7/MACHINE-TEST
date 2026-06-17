import os
import random
import string
import time
from datetime import date, timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from users.models import Cities, Hobbies, States, UserProfile


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

DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com']


def random_phone(existing):
    for _ in range(100):
        number = '9' + ''.join(random.choices(string.digits, k=9))
        if number not in existing:
            existing.add(number)
            return number
    raise CommandError('Could not generate a unique phone number after 100 attempts.')


def random_dob():
    offset = random.randint(18 * 365, 60 * 365)
    return date.today() - timedelta(days=offset)


def get_photo_paths():
    """Return list of relative paths (relative to MEDIA_ROOT) for existing profile photos."""
    photo_dir = os.path.join(settings.MEDIA_ROOT, 'profile_photos')
    if not os.path.isdir(photo_dir):
        return []
    valid_exts = {'.jpg', '.jpeg', '.png'}
    paths = []
    for fname in os.listdir(photo_dir):
        if os.path.splitext(fname)[1].lower() in valid_exts:
            paths.append(os.path.join('profile_photos', fname))
    return paths


class Command(BaseCommand):
    help = 'Generate dummy UserProfile records for testing.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count', type=int, default=20,
            help='Number of dummy users to create (default: 20)',
        )
        parser.add_argument(
            '--delay', type=float, default=0,
            help='Seconds to wait between each user creation (default: 0)',
        )
        parser.add_argument(
            '--states', type=int, nargs='+', metavar='ID',
            help='Restrict to specific state IDs (e.g. --states 4 5 6). Defaults to all states.',
        )

    def handle(self, *args, **options):
        count = options['count']
        delay = options['delay']
        state_ids = options.get('states')

        # Load states → cities, optionally restricted to given IDs
        qs = States.objects.filter(id__in=state_ids) if state_ids else States.objects.all()
        state_city_map = {}
        for state in qs:
            cities = list(Cities.objects.filter(state=state))
            if cities:
                state_city_map[state] = cities

        if not state_city_map:
            raise CommandError('No states/cities found. Populate them first.')

        # Load all hobby objects from DB
        all_hobbies = list(Hobbies.objects.all())
        if not all_hobbies:
            raise CommandError('No hobbies found. Run the shell command to populate Hobbies first.')

        # Collect existing numbers to avoid duplicates
        existing_numbers = set(
            UserProfile.objects.values_list('phone', flat=True)
        ) | set(
            UserProfile.objects.values_list('mobile', flat=True)
        )
        existing_numbers.discard('')

        # Collect available photos from media folder
        photo_paths = get_photo_paths()
        if photo_paths:
            self.stdout.write(f'Found {len(photo_paths)} photos in media folder.')
        else:
            self.stdout.write(self.style.WARNING('No photos found in media/profile_photos/ — users will have no photo.'))

        created = 0
        skipped = 0

        for i in range(count):
            gender = random.choice(['M', 'F'])
            first = random.choice(FIRST_NAMES_M if gender == 'M' else FIRST_NAMES_F)
            last = random.choice(LAST_NAMES)
            name = f'{first} {last}'[:25]

            dob = random_dob()

            email = ''
            if random.random() < 0.7:
                candidate = f'{first.lower()}.{last.lower()}{random.randint(1, 999)}@{random.choice(DOMAINS)}'
                if len(candidate) <= 254:
                    email = candidate

            contact_choice = random.choice(['phone', 'mobile', 'both'])
            phone = mobile = ''
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

            # Random subset of hobbies (0 to all)
            hobbies = random.sample(all_hobbies, k=random.randint(0, len(all_hobbies)))

            # ~80% of users get a photo
            photo_path = ''
            if photo_paths and random.random() < 0.8:
                photo_path = random.choice(photo_paths)

            try:
                user = UserProfile.objects.create(
                    name=name,
                    gender=gender,
                    birth_date=dob,
                    email=email,
                    phone=phone,
                    mobile=mobile,
                    state=state,
                    city=city,
                    photo=photo_path,
                )
                user.hobbies.set(hobbies)
                created += 1
                self.stdout.write(f'  [{created}/{count}] {name}')
                if delay:
                    time.sleep(delay)
            except Exception as e:
                self.stderr.write(f'Row {i + 1} skipped: {e}')
                skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done. Created {created} users. Skipped {skipped}.'
        ))
