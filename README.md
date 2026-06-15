# Machine Test — Django REST API

A Django REST Framework backend with user profile registration, state/city lookup, and filtering.

---

## Setup

**1. Clone the repo and create a virtual environment**
```bash
git clone <repo-url>
cd machine_test
python -m venv .venv
source .venv/bin/activate
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Create a `.env` file in the `machine_test/` folder**
```
SECRET_KEY=your-secret-key-here
DEBUG=True
```

**4. Run migrations**
```bash
python manage.py migrate
```

**5. Collect static files**
```bash
python manage.py collectstatic --noinput
```

**6. Start the server**
```bash
python manage.py runserver 0.0.0.0:8000
```

---

## API Docs

Once the server is running:

| Tool | URL |
|---|---|
| Swagger UI | `http://localhost:8000/api/docs/` |
| ReDoc | `http://localhost:8000/api/redoc/` |

For full endpoint documentation see [API_DOCS.md](API_DOCS.md).

---

## Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/api/states/` | List all states |
| GET | `/api/cities/?state_id=<id>` | List cities for a state |
| POST | `/api/register/` | Register a user profile |
| GET | `/api/users/` | List users (filterable, paginated) |

---

## Tech Stack

- Python / Django 6
- Django REST Framework
- drf-spectacular (Swagger/ReDoc)
- django-filter
- django-cors-headers
