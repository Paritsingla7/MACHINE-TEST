# Machine Test — Django REST API + Web Frontend

A full-stack Django project with a REST API for user profile management and a web frontend for browsing and registering users.

---

## Project Structure

```
machine_test/
├── machine_test/          # Django project settings & root URLs
├── users/                 # User profile app
│   ├── models.py          # UserProfile, States, Cities, Hobbies
│   ├── serializers.py     # Read/write serializer with validation
│   ├── views.py           # API views
│   └── filters.py         # django-filter filtersets
├── frontend/              # Web frontend Django app
│   ├── templates/frontend/
│   │   ├── users.html     # User list page
│   │   └── register.html  # Registration form
│   └── static/frontend/
│       ├── js/            # users.js, register.js
│       └── css/           # base.css, users.css, register.css
├── media/                 # Uploaded profile photos  [gitignored]
├── staticfiles/           # Collected static files   [gitignored]
├── db.sqlite3             # SQLite database          [gitignored]
├── .env                   # Secrets                  [gitignored]
├── requirements.txt
└── API_DOCS.md
```

---

## Setup

### 1. Clone and create a virtual environment

```bash
git clone <repo-url>
cd machine_test
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Create `.env` inside `machine_test/` (next to `settings.py`)

```
SECRET_KEY=your-secret-key-here
DEBUG=True
```

### 4. Run migrations

```bash
python manage.py migrate
```

### 5. Collect static files

```bash
python manage.py collectstatic --noinput
```

### 6. Start the server

```bash
python manage.py runserver 0.0.0.0:8000
```

---

## Features

### Web Frontend (`/`)

- **Filter** users by name (partial match), state, and gender
- **Sort** any column by clicking its header — click again to reverse, third click resets to default (newest first)
- **Column visibility** — toggle columns on/off via the Columns button; also trims the API response via sparse fieldsets automatically
- **Page size** — choose 5 / 10 / 25 / 50 / 100 per page, or double-click the dropdown to type a custom number (1–100)
- **Page jump** — type any page number directly into the Go to input in the pagination bar

### API (`GET /api/users/`)

- **Filtering** — by name (case-insensitive partial), state ID, gender
- **Sorting** — any field, case-insensitive for text fields, multi-field with comma separation (`?ordering=state,-name`)
- **Pagination** — configurable page size up to 100 (`?page_size=25`), explicit page number (`?page=3`)
- **Sparse fieldsets** — request only the fields you need (`?fields=id,name,email,state`)

---

## Web Pages

| Page | URL |
|---|---|
| User list (filter, sort, paginate) | `http://localhost:8000/` |
| Register a new user | `http://localhost:8000/register/` |

---

## API Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/api/states/` | List all states |
| GET | `/api/cities/?state_id=<id>` | List cities for a state |
| POST | `/api/register/` | Register a user profile |
| GET | `/api/users/` | List users — filterable, sortable, paginated, sparse fieldsets |

See [API_DOCS.md](API_DOCS.md) for full request/response details.

Interactive docs once the server is running:

| Tool | URL |
|---|---|
| Swagger UI | `http://localhost:8000/api/docs/` |
| ReDoc | `http://localhost:8000/api/redoc/` |

---

## Tech Stack

### Backend

- Python / Django 6
- Django REST Framework
- drf-spectacular (OpenAPI, Swagger UI, ReDoc)
- django-filter
- django-cors-headers
- python-dotenv

### Frontend

- Plain HTML / CSS / JavaScript (no framework)
- Flatpickr (date picker)
