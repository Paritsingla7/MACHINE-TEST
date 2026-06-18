# Machine Test — Django REST API + Web Frontend

A full-stack Django project with a REST API for user profile management and a web frontend for browsing and registering users. Includes JWT-based authentication.

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

### 5. Seed the database (states, cities, hobbies)

```bash
python manage.py seed_db
```

### 6. Collect static files

```bash
python manage.py collectstatic --noinput
```

### 7. Start the server

```bash
python manage.py runserver 0.0.0.0:8000
```

---

## Features

### Web Frontend

- **Register** a new user profile at `/register/`
- **Filter** users by name (partial match), state, and gender
- **Sort** any column by clicking its header — click again to reverse, third click resets to default (newest first)
- **Column visibility** — toggle columns on/off via the Columns button; also trims the API response via sparse fieldsets automatically
- **Page size** — choose 5 / 10 / 25 / 50 / 100 per page, or double-click the dropdown to type a custom number (1–100)
- **Page jump** — type any page number directly into the Go to input in the pagination bar

### API

- **JWT Authentication** — register and login return `access` + `refresh` tokens; use Bearer token in the `Authorization` header for protected endpoints
- **Register** — creates a `UserProfile` and a linked Django `User`; returns tokens immediately so the client is logged in right after signup
- **Login** — exchange `username` + `password` for a new token pair
- **Token refresh** — get a new access token using a valid refresh token
- **Me** — get the profile of the currently authenticated user
- **User list** — paginated, filterable, sortable list (admin only)
- **Filtering** — by name (case-insensitive partial), state ID, gender
- **Sorting** — any field, case-insensitive for text fields, multi-field ordering
- **Pagination** — configurable page size up to 100
- **Sparse fieldsets** — request only the fields you need via `?fields=`

---

## Web Pages

| Page | URL |
| --- | --- |
| User list (filter, sort, paginate) | `http://localhost:8000/` |
| Register a new user | `http://localhost:8000/register/` |

---

## API Endpoints

| Method | URL | Auth required | Description |
| --- | --- | --- | --- |
| GET | `/api/states/` | No | List all states |
| GET | `/api/cities/?state_id=<id>` | No | List cities for a state |
| POST | `/api/register/` | No | Register a user — returns JWT tokens |
| POST | `/api/login/` | No | Login — returns JWT tokens |
| POST | `/api/token/refresh/` | No | Refresh access token |
| GET | `/api/me/` | Bearer token | Get own profile |
| GET | `/api/users/` | Admin only | List users — filterable, sortable, paginated |

See [API_DOCS.md](API_DOCS.md) for full request/response details.

Interactive docs once the server is running:

| Tool | URL |
| --- | --- |
| Swagger UI | `http://localhost:8000/api/docs/` |
| ReDoc | `http://localhost:8000/api/redoc/` |

---

## Authentication Flow

1. **Register** — `POST /api/register/` — save the returned `username`, `access`, and `refresh` tokens
2. **Make authenticated requests** — add `Authorization: Bearer <access_token>` header
3. **Refresh** — when the access token expires, call `POST /api/token/refresh/` with the refresh token to get a new one
4. **Login again** — `POST /api/login/` with `username` + `password`

> The `username` is auto-generated at registration (e.g. `paritsingla4821`). It is returned in the register response — store it on the client side for future logins.

---

## Known Issues & Security Gaps

These are real problems in the current state of the project. They are documented here so they are not forgotten and are fixed before any production or public use.

### Critical

| # | Issue | Where | Impact |
| --- | --- | --- | --- |
| 1 | **Web registration is broken** | `register.html`, `register.js` | The serializer now requires a `password` field (min 8 chars) but the HTML form and JS do not send one. Every registration attempt from the browser returns `{"errors": {"password": ["This field is required."]}}`. |
| 2 | **User list page is broken for everyone** | `views.py` — `UserListView` | `permission_classes = [IsAdminUser]` means only Django superusers with a valid JWT can access `/api/users/`. The web frontend sends no token so the list page returns 401 for all visitors. |
| 3 | **Login requires username users don't know** | `urls.py` — `/api/login/` | `TokenObtainPairView` expects `username` + `password`. Usernames are random strings generated at registration (e.g. `paritsingla4821`). If the client didn't save the `username` from the register response, the user cannot log in. |

### Medium

| # | Issue | Where | Impact |
| --- | --- | --- | --- |
| 4 | **CORS middleware in wrong position** | `settings.py` — `MIDDLEWARE` | `CorsMiddleware` must be **first** in the list. It is currently **last**, so it runs after responses are already generated and adds no CORS headers. Android app cross-origin requests will be blocked by the browser. |
| 5 | **No CORS origins configured** | `settings.py` | Neither `CORS_ALLOWED_ORIGINS` nor `CORS_ALLOW_ALL_ORIGINS` is set anywhere. Even after fixing position, CORS headers will not be sent until one of these is added. |
| 6 | **No logout / token blacklisting** | — | There is no logout endpoint and no token blacklist. Once issued, an access token is valid until it expires. A user whose token is stolen cannot revoke it. SimpleJWT's `BLACKLIST_APP` is not enabled. |
| 7 | **No rate limiting on auth endpoints** | `/api/login/`, `/api/register/` | No throttling is configured. These endpoints are open to brute-force and credential-stuffing attacks. |

### Low / Pre-production

| # | Issue | Where | Impact |
| --- | --- | --- | --- |
| 8 | **`ALLOWED_HOSTS = ['*']`** | `settings.py` | Fine for local dev. Must be locked down to actual domain(s) before going public. |
| 9 | **`DEBUG=True` in `.env` example** | README, `.env` | If `DEBUG=True` in production Django serves full tracebacks to anyone who hits a 500 error, leaking internal code paths and settings. |
| 10 | **No HTTPS enforcement** | `settings.py` | No `SECURE_SSL_REDIRECT`, `SECURE_HSTS_SECONDS`, or cookie security flags. Tokens travel in plaintext over HTTP. |
| 11 | **Duplicate import in views.py** | `views.py` lines 12 & 14 | `from rest_framework_simplejwt.tokens import RefreshToken` is imported twice. Cosmetic but messy. |

---

## Tech Stack

### Backend

- Python / Django 6
- Django REST Framework
- djangorestframework-simplejwt (JWT auth)
- drf-spectacular (OpenAPI, Swagger UI, ReDoc)
- django-filter
- django-cors-headers
- python-dotenv

### Frontend

- Plain HTML / CSS / JavaScript (no framework)
- Flatpickr (date picker)
