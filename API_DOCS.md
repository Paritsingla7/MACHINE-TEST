# API Documentation

Base URL: `http://<your-server>/api`

---

## Interactive Testing (Swagger UI)

| Tool | URL |
|---|---|
| Swagger UI (recommended) | `GET /api/docs/` |
| ReDoc (read-only) | `GET /api/redoc/` |
| Raw OpenAPI schema (JSON) | `GET /api/schema/` |

Open Swagger UI in a browser, click **Try it out** on any endpoint, fill in the fields, and hit **Execute** to test live.

---

## Frontend Form Flow

This is the recommended order to call APIs when building a registration form:

```
1. GET /api/states/         → populate state dropdown
2. GET /api/cities/?state_id=<id>   → on state select, populate city dropdown
3. POST /api/register/      → submit the form
4. GET /api/users/          → display registered users (with optional filters)
```

---

## Endpoints

### 1. List States
`GET /api/states/`

Returns all states. Call this on page load to populate the state dropdown.

**No parameters required.**

**Response `200 OK`:**

```json
[
  { "id": 1, "name": "Maharashtra" },
  { "id": 2, "name": "Gujarat" }
]
```

---

### 2. List Cities by State
`GET /api/cities/`

Returns all cities for a given state. Call this when the user selects a state.

**Query parameters:**

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `state_id` | integer | Yes | ID of the selected state |

**Response `200 OK`:**

```json
[
  { "id": 1, "name": "Mumbai" },
  { "id": 2, "name": "Pune" }
]
```

**Response `400 Bad Request`** (if `state_id` is missing):

```json
{ "error": "state_id query parameter is required." }
```

---

### 3. Register User
`POST /api/register/`

Creates a new user profile. Call this on form submit.

**Content-Type:** `multipart/form-data` (required if uploading a photo, otherwise `application/json`)

**Request body:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Max 25 characters |
| `gender` | string | Yes | `M` or `F` |
| `birth_date` | string (date) | Yes | Format: `DD/MM/YYYY`. Cannot be in the future. |
| `email` | string | No | Must be a valid email format |
| `phone` | string | No | 10 digits. At least one of `phone` or `mobile` is required. |
| `mobile` | string | No | 10 digits. At least one of `phone` or `mobile` is required. |
| `state` | integer | No | ID from `/api/states/` |
| `city` | integer | No | ID from `/api/cities/`. Must belong to the selected state. |
| `hobbies` | array of strings | No | Any of: `hockey`, `chess`, `football`, `cricket` |
| `photo` | file | No | JPG or PNG only |

**Response `201 Created`:**

```json
{
  "id": 5,
  "name": "Jane Doe",
  "gender": "F",
  "birth_date": "10/04/1998",
  "email": "jane@example.com",
  "phone": "9876543210",
  "mobile": "",
  "state": 1,
  "city": 2,
  "hobbies": ["chess", "cricket"],
  "photo": "/media/profile_photos/jane.jpg"
}
```

**Response `400 Bad Request`:**

```json
{
  "errors": {
    "contact": "At least one contact number (phone or mobile) must be provided.",
    "name": "Name cannot exceed 25 characters.",
    "gender": "Gender must be either \"M\" for male or \"F\" for female",
    "photo": "Photo must be in JPG or PNG format."
  }
}
```

---

### 4. List Users
`GET /api/users/`

Returns a paginated list of all registered user profiles. Supports filtering.

**Query parameters:**

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `name` | string | No | Case-insensitive partial match |
| `state` | integer | No | Filter by state ID |
| `gender` | string | No | `M` or `F` |
| `page` | integer | No | Page number (default: 1, page size: 10) |

**Response `200 OK`:**

```json
{
  "count": 42,
  "next": "http://.../api/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "John Doe",
      "gender": "M",
      "birth_date": "15/06/1995",
      "email": "john@example.com",
      "phone": "9876543210",
      "mobile": "",
      "state": 3,
      "city": 12,
      "hobbies": ["cricket", "chess"],
      "photo": "/media/profile_photos/john.jpg"
    }
  ]
}
```

---

## Testing in Swagger UI (Step by Step)

1. Open `http://<your-server>/api/docs/`
2. **Test states:** Expand `GET /api/states/` → click **Try it out** → **Execute** → you should see a list of states with their IDs
3. **Test cities:** Expand `GET /api/cities/` → **Try it out** → enter a `state_id` from step 2 → **Execute**
4. **Test register:** Expand `POST /api/register/` → **Try it out** → fill in the fields using state/city IDs from above → **Execute**
5. **Test user list:** Expand `GET /api/users/` → **Try it out** → leave filters blank to get all, or filter by `name`/`state`/`gender` → **Execute**

---

## Notes for Frontend

- **Date format:** Send `birth_date` as `DD/MM/YYYY` (e.g. `25/12/1995`).
- **Photo upload:** Use `multipart/form-data` when sending a photo. Do not use `application/json` for that endpoint.
- **Hobbies:** Send as multiple values with the same key e.g. `hobbies=cricket&hobbies=chess`.
- **State → City dependency:** Always fetch cities after a state is selected — cities are filtered by state. A city ID from a different state will fail validation.
- **Pagination:** Use the `next` and `previous` URLs from the list response to navigate pages, or pass `?page=N` directly.
- **phone/mobile:** At least one must be provided. Both are optional individually but one is mandatory.
