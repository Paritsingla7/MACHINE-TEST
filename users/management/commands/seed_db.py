from django.core.management.base import BaseCommand
from users.models import States, Cities, Hobbies


SEED_DATA = {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kurnool'],
    'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Lajpat Nagar'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubli', 'Belagavi'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'],
}

HOBBIES = ['Football', 'Chess', 'Cricket', 'Swimming', 'Hockey']


class Command(BaseCommand):
    help = 'Seeds the database with states, cities, and hobbies.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding hobbies...')
        for name in HOBBIES:
            Hobbies.objects.get_or_create(name=name)
        self.stdout.write(self.style.SUCCESS(f'  {len(HOBBIES)} hobbies ready.'))

        self.stdout.write('Seeding states and cities...')
        state_count = 0
        city_count = 0
        for state_name, cities in SEED_DATA.items():
            state, _ = States.objects.get_or_create(name=state_name)
            state_count += 1
            for city_name in cities:
                Cities.objects.get_or_create(name=city_name, state=state)
                city_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'  {state_count} states, {city_count} cities ready.'
        ))
        self.stdout.write(self.style.SUCCESS('Seeding complete. DB is ready to test.'))
