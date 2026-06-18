# Machine Test — Django REST API + Web Frontend

A full-stack Django project with a REST API for user profile management and a vanilla JS web frontend. Includes JWT-based authentication, role-based routing, and an admin-only user list view.

---

## Project Structure

```text
machine_test/
├── machine_test/          # Django project settings & root URLs
├── users/                 # User profile app
│   ├── models.py          # UserProfile, States, Cities, Hobbies
│   ├── serializers.py     # Read/write serializer with validation
│   ├── views.py           # API views
│   └── filters.py         # django-filter filtersets
├── frontend/              # Web frontend Django app
│   ├── views.py           # Template-serving views
│   ├── urls.py            # Frontend URL routes
│   ├── templates/frontend/
│   │   ├── login.html     # Login page
│   │   ├── register.html  # Registration form
│   │   ├── profile.html   # My profile page
│   │   └── users.html     # User list page (admin only)
│   └── static/frontend/
│       ├── js/
│       │   ├── auth.js      # Shared auth utilities (AUTH object, token storage, auto-refresh)
│       │   ├── login.js     # Login form logic
│       │   ├── register.js  # Registration form logic
│       │   ├── profile.js   # Profile page logic
│       │   └── users.js     # User list page logic
│       └── css/
│           ├── base.css     # Buttons, spinners, shared utilities
│           ├── login.css    # Login page layout overrides
│           ├── register.css # Registration form styles (also used by login)
│           ├── profile.css  # Profile page styles
│           └── users.css    # User list table and filters
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

```env
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

## Web Pages

| Page | URL | Access |
| --- | --- | --- |
| Root | `/` | Redirects to `/login/` |
| Login | `/login/` | Public — redirects away if already logged in |
| Register | `/register/` | Public |
| My Profile | `/profile/` | Authenticated users only — redirects to `/login/` if unauthenticated |
| User List | `/users/` | Admin only — redirects to `/login/` or `/profile/` if not admin |

---

## Features

### Web Frontend

- **Login** — authenticate with username + password; admin users are routed to `/users/`, regular users to `/profile/`
- **Register** — create an account with a user-chosen username (≥4 letters + ≥4 digits), password, and full profile details; redirects to `/profile/` on success
- **My Profile** — view your own profile including name, photo, gender, DOB, location, and hobbies; includes a Change Password button (placeholder)
- **User List** (admin only) — filterable by name, state, and gender; sortable by any column; configurable page size; sparse fieldset to trim API response
- **Password visibility toggle** — eye icon on all password inputs (login, register, profile)
- **Auto token refresh** — expired access tokens are refreshed silently using the refresh token; user is only redirected to login if the refresh also fails
- **Auth guards** — every page checks token presence and admin status on load; unauthorized access redirects instantly

### API

- **JWT Authentication** — register and login return `access` + `refresh` tokens; send `Authorization: Bearer <access>` for protected endpoints
- **Register** — creates a `UserProfile` and linked Django `User` atomically; returns tokens immediately so the client is logged in right after signup
- **Login** — exchange `username` + `password` for a token pair; response includes `is_admin` flag for client-side routing
- **Token refresh** — get a new access token using a valid refresh token
- **Me / Profile** — get the full profile of the authenticated user
- **User list** — paginated (10/page default, max 100), filterable, sortable, with sparse fieldsets
- **Hobbies list** — fetch all available hobbies with their IDs for use in the registration form

---

## API Endpoints

| Method | URL | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/states/` | No | List all states |
| GET | `/api/cities/?state_id=<id>` | No | List cities for a state |
| GET | `/api/hobbies/` | No | List all hobbies |
| POST | `/api/register/` | No | Register — returns JWT tokens |
| POST | `/api/login/` | No | Login — returns JWT tokens + `is_admin` |
| POST | `/api/token/refresh/` | No | Refresh access token |
| GET | `/api/profile/` | Bearer token | Get own profile |
| GET | `/api/users/` | Admin only | List users — filterable, sortable, paginated |

See [API_DOCS.md](API_DOCS.md) for full request/response details.

Interactive docs (server must be running):

| Tool | URL |
| --- | --- |
| Swagger UI | `http://localhost:8000/api/docs/` |
| ReDoc | `http://localhost:8000/api/redoc/` |

---

## Authentication Flow

1. **Register** — `POST /api/register/` with a chosen `username` (alphanumeric, ≥4 letters + ≥4 digits), `password`, and profile data → save the returned `access`, `refresh`, and `username` tokens
2. **Login** — `POST /api/login/` with `username` + `password` → save `access`, `refresh`, `username`, `is_admin`; route to `/users/` if admin, `/profile/` otherwise
3. **Make authenticated requests** — add `Authorization: Bearer <access_token>` to the `Authorization` header
4. **Silent refresh** — when a request returns `401`, automatically retry `POST /api/token/refresh/` with the stored refresh token and replay the original request with the new access token
5. **Logout** — clear all stored tokens from localStorage; redirect to `/login/`

---

## Known Issues

Issues that existed at project start and are still open. None of these affect core functionality in a local development context but must be resolved before any public or production deployment.

### Medium

| # | Issue | Where | Impact |
| --- | --- | --- | --- |
| 1 | **CORS middleware in wrong position** | `settings.py` — `MIDDLEWARE` | `CorsMiddleware` must be **first** in the list. It is currently last, so CORS headers are never added. Cross-origin requests from mobile apps or separate frontends will be blocked. |
| 2 | **No CORS origins configured** | `settings.py` | Neither `CORS_ALLOWED_ORIGINS` nor `CORS_ALLOW_ALL_ORIGINS` is set. Even after fixing position, no CORS headers will be sent until one of these is configured. |
| 3 | **No server-side token blacklist** | — | There is no logout endpoint and no token blacklist. Once issued, an access token is valid until it naturally expires. A stolen access token cannot be revoked. Client-side logout (clearing localStorage) is implemented but does not invalidate tokens on the server. |
| 4 | **No rate limiting on auth endpoints** | `/api/login/`, `/api/register/` | No throttling is configured. Both endpoints are open to brute-force and credential-stuffing attacks. |

### Low / Pre-production

| # | Issue | Where | Impact |
| --- | --- | --- | --- |
| 5 | **`ALLOWED_HOSTS = ['*']`** | `settings.py` | Fine for local dev. Must be restricted to the actual domain(s) before going public. |
| 6 | **No HTTPS enforcement** | `settings.py` | No `SECURE_SSL_REDIRECT`, `SECURE_HSTS_SECONDS`, or secure cookie flags. JWT tokens travel in plaintext over HTTP. |
| 7 | **`DEBUG=True` in `.env` example** | README | In production, `DEBUG=True` causes Django to serve full tracebacks to anyone who triggers a 500 error, leaking internal code and settings. |

---

## Tech Stack

### Backend

- Python / Django 6
- Django REST Framework 3
- djangorestframework-simplejwt (JWT auth)
- drf-spectacular (OpenAPI schema, Swagger UI, ReDoc)
- django-filter
- django-cors-headers
- python-dotenv

### Frontend

- Plain HTML / CSS / JavaScript (no framework)
- Flatpickr (date picker calendar)
