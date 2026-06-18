# API Documentation

Base URL: `http://<your-server>/api`

All responses are JSON. Registration requests must be sent as `multipart/form-data`. All other POST requests accept either `application/json` or `multipart/form-data`.

Interactive docs once the server is running:

| Tool | URL |
| --- | --- |
| Swagger UI | `http://localhost:8000/api/docs/` |
| ReDoc | `http://localhost:8000/api/redoc/` |

---

## Endpoints

| Method | Endpoint | Auth required | Description |
| --- | --- | --- | --- |
| GET | `/api/states/` | No | List all states |
| GET | `/api/cities/` | No | List cities for a given state |
| GET | `/api/hobbies/` | No | List all available hobbies |
| POST | `/api/register/` | No | Create a new user profile — returns JWT tokens |
| POST | `/api/login/` | No | Login — returns JWT tokens + admin flag |
| POST | `/api/token/refresh/` | No | Exchange a refresh token for a new access token |
| GET | `/api/profile/` | Bearer token | Get the profile of the authenticated user |
| GET | `/api/users/` | Admin only | List user profiles — filterable, sortable, paginated |

---

## Authentication

This API uses JWT (JSON Web Token) authentication via `djangorestframework-simplejwt`.

Include the access token in the `Authorization` header for all protected endpoints:

```http
Authorization: Bearer <access_token>
```

Access tokens expire in 5 minutes by default. Use the refresh token to obtain a new access token without requiring the user to log in again.

---

## Error Response Format

All validation errors return HTTP `400` with this structure:

```json
{
  "errors": {
    "field_name": "Error message.",
    "another_field": "Another error message."
  }
}
```

Only fields that failed validation appear in `errors`. The key `contact` is used when neither `phone` nor `mobile` is provided.

---

## 1. List States

`GET /api/states/`

Returns all states. No parameters. No authentication required.

**Response `200 OK`:**

```json
[
  { "id": 1, "name": "Maharashtra" },
  { "id": 2, "name": "Gujarat" }
]
```

---

## 2. List Cities by State

`GET /api/cities/`

Returns all cities belonging to a given state. No authentication required.

**Query parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `state_id` | integer | Yes | ID of the state from `GET /api/states/` |

**Response `200 OK`:**

```json
[
  { "id": 1, "name": "Mumbai" },
  { "id": 2, "name": "Pune" }
]
```

**Response `400 Bad Request` — missing parameter:**

```json
{ "error": "state_id query parameter is required." }
```

**Response `400 Bad Request` — non-integer value:**

```json
{ "error": "state_id must be a valid integer." }
```

---

## 3. List Hobbies

`GET /api/hobbies/`

Returns all available hobbies. No parameters. No authentication required.

Use the returned `id` values when selecting hobbies during registration (`hobbies_ids` field).

**Response `200 OK`:**

```json
[
  { "id": 1, "name": "Hockey" },
  { "id": 2, "name": "Chess" },
  { "id": 3, "name": "Football" },
  { "id": 4, "name": "Cricket" },
  { "id": 5, "name": "Swimming" }
]
```

---

## 4. Register User

`POST /api/register/`

Creates a new user profile and a linked Django auth user. Returns JWT tokens immediately so the client is authenticated right after registration.

**Content-Type:** `multipart/form-data`

### Request Fields

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `name` | string | Yes | Max 25 characters |
| `username` | string | Yes | Alphanumeric only. Must contain ≥4 letters and ≥4 digits (e.g. `john1234`). Must be unique |
| `password` | string | Yes | Min 8 characters |
| `gender` | string | Yes | `M` or `F` |
| `birth_date` | string | Yes | Format: `DD/MM/YYYY`. Cannot be future date. Cannot be more than 90 years ago |
| `state_id` | integer | Yes | ID from `GET /api/states/` |
| `phone` | string | Conditional | Exactly 10 digits. At least one of `phone` or `mobile` is required. Must be unique across all users (cross-checked against `mobile` too) |
| `mobile` | string | Conditional | Exactly 10 digits. At least one of `phone` or `mobile` is required. Must be unique across all users (cross-checked against `phone` too) |
| `email` | string | No | Valid email format. Must be unique if provided. Stored as `NULL` when omitted |
| `city_id` | integer | No | ID from `GET /api/cities/`. Must belong to the selected state |
| `hobbies_ids` | integer (repeatable) | No | Hobby IDs from `GET /api/hobbies/`. Send as repeated field |
| `photo` | file | No | JPG or PNG only. Max 5 MB |

**Hobbies example (multipart):**

```text
hobbies_ids=1
hobbies_ids=3
```

### Response `201 Created`

```json
{
  "user": {
    "id": 5,
    "name": "Jane Doe",
    "gender": "F",
    "birth_date": "10/04/1998",
    "email": "jane@example.com",
    "phone": "9876543210",
    "mobile": null,
    "state": "Maharashtra",
    "city": "Pune",
    "hobbies": [
      { "id": 1, "name": "Hockey" },
      { "id": 3, "name": "Football" }
    ],
    "photo": "http://<server>/media/profile_photos/jane.jpg",
    "created_at": "2024-06-15T10:30:00Z"
  },
  "username": "jane1234",
  "access": "<jwt-access-token>",
  "refresh": "<jwt-refresh-token>"
}
```

> The `username` in the response is the same value the user chose at registration. Store the `access` and `refresh` tokens on the client — the user is now logged in.

### Response `400 Bad Request`

```json
{
  "errors": {
    "name": "Name cannot exceed 25 characters.",
    "username": "Username must contain at least 4 letters and 4 numbers.",
    "password": "This field may not be blank.",
    "birth_date": "Age cannot be more than 90 years.",
    "gender": "Gender must be either \"M\" for male or \"F\" for female",
    "contact": "At least one contact number (phone or mobile) must be provided.",
    "phone": "Phone number must be 10 digits long.",
    "mobile": "This mobile number is already registered.",
    "email": "This email address is already registered.",
    "state": "State must be selected.",
    "city": "City must belong to the selected state.",
    "photo": "Photo must not exceed 5 MB."
  }
}
```

---

## 5. Login

`POST /api/login/`

Exchange a username and password for a JWT token pair. Also returns the `is_admin` flag so the client can route the user to the correct page.

**Content-Type:** `application/json` or `multipart/form-data`

### Login — Request Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | Yes | The username chosen at registration |
| `password` | string | Yes | The password set at registration |

### Login — Response `200 OK`

```json
{
  "access": "<jwt-access-token>",
  "refresh": "<jwt-refresh-token>",
  "username": "jane1234",
  "is_admin": false
}
```

> `is_admin` is `true` for Django superusers and `false` for regular users. Use this to route after login: admins go to the user list, regular users go to their profile.

### Login — Response `401 Unauthorized`

```json
{
  "detail": "No active account found with the given credentials"
}
```

---

## 6. Refresh Token

`POST /api/token/refresh/`

Get a new access token using a valid refresh token. Use this when the access token expires instead of requiring the user to log in again.

**Content-Type:** `application/json`

### Refresh — Request Body

```json
{
  "refresh": "<jwt-refresh-token>"
}
```

### Refresh — Response `200 OK`

```json
{
  "access": "<new-jwt-access-token>"
}
```

### Refresh — Response `401 Unauthorized`

```json
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
```

---

## 7. Get My Profile

`GET /api/profile/`

Returns the full profile of the currently authenticated user.

**Authentication:** Required — `Authorization: Bearer <access_token>`

### Me — Response `200 OK`

```json
{
  "id": 5,
  "name": "Jane Doe",
  "gender": "F",
  "birth_date": "10/04/1998",
  "email": "jane@example.com",
  "phone": "9876543210",
  "mobile": null,
  "state": "Maharashtra",
  "city": "Pune",
  "hobbies": [
    { "id": 1, "name": "Hockey" }
  ],
  "photo": "http://<server>/media/profile_photos/jane.jpg",
  "created_at": "2024-06-15T10:30:00Z"
}
```

### Me — Response `401 Unauthorized`

```json
{
  "detail": "Authentication credentials were not provided."
}
```

### Me — Response `404 Not Found`

```json
{
  "error": "Profile not found."
}
```

> This can occur if an authenticated `User` exists in the system but has no linked `UserProfile` record.

---

## 8. List Users

`GET /api/users/`

Returns a paginated, filterable, sortable list of all user profiles. Supports sparse fieldsets to limit response size.

**Authentication:** Required — Admin users only (`IsAdminUser`).

- Unauthenticated requests → `401 Unauthorized`
- Authenticated non-admin requests → `403 Forbidden`

### Filtering

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | string | Case-insensitive partial match on the user's name. E.g. `?name=raj` |
| `state` | integer | Filter by state ID. E.g. `?state=2` |
| `gender` | string | `M` or `F` |

### Sorting

| Parameter | Type | Description |
| --- | --- | --- |
| `ordering` | string | Comma-separated fields. Prefix with `-` for descending. Default: `-created_at` |

**Sortable fields:** `name`, `gender`, `birth_date`, `email`, `mobile`, `phone`, `state`, `city`, `created_at`

- Text fields (`name`, `email`, `state`, `city`) sort **case-insensitively**
- `state` and `city` sort by display name, not ID
- Multi-field example: `?ordering=state,-name`

### Pagination

| Parameter | Type | Description |
| --- | --- | --- |
| `page` | integer | Page number. Default: `1` |
| `page_size` | integer | Results per page. Default: `10`. Max: `100` |

### Sparse Fieldsets

| Parameter | Type | Description |
| --- | --- | --- |
| `fields` | string | Comma-separated field names to include in each result object |

Available fields: `id`, `name`, `gender`, `birth_date`, `email`, `phone`, `mobile`, `state`, `city`, `hobbies`, `photo`, `created_at`

Always include `id` to keep results identifiable. Example: `?fields=id,name,state,created_at`

### Combined Example

```http
GET /api/users/?name=raj&state=1&ordering=name&page=2&page_size=25&fields=id,name,email,state
```

### Users — Response `200 OK`

```json
{
  "count": 42,
  "next": "http://<server>/api/users/?page=3",
  "previous": "http://<server>/api/users/?page=1",
  "results": [
    {
      "id": 1,
      "name": "John Doe",
      "gender": "M",
      "birth_date": "15/06/1995",
      "email": "john@example.com",
      "phone": "9876543210",
      "mobile": null,
      "state": "Maharashtra",
      "city": "Mumbai",
      "hobbies": [
        { "id": 1, "name": "Hockey" },
        { "id": 4, "name": "Cricket" }
      ],
      "photo": "http://<server>/media/profile_photos/john.jpg",
      "created_at": "2024-06-15T10:30:00Z"
    }
  ]
}
```

> `next` and `previous` are `null` when there is no adjacent page. `photo` is `null` if no photo was uploaded. `state` and `city` are name strings, not IDs. `hobbies` is an array of `{ "id", "name" }` objects. Omitted optional string fields (`phone`, `mobile`, `email`) are `null`, not empty strings.

### Users — Response `401 Unauthorized`

```json
{
  "detail": "Authentication credentials were not provided."
}
```

### Users — Response `403 Forbidden`

```json
{
  "detail": "You do not have permission to perform this action."
}
```

---

## Notes

- **Date format:** All dates — both sent and received — use `DD/MM/YYYY`.
- **Write vs read field names:** Registration accepts `state_id`, `city_id`, and `hobbies_ids` (IDs). Responses return `state` and `city` as name strings, and `hobbies` as `[{ "id", "name" }]` objects.
- **Hobbies on write:** Send as repeated `hobbies_ids` fields using integer IDs from `GET /api/hobbies/`.
- **Hobbies on read:** Returned as `[{ "id": 1, "name": "Hockey" }]`.
- **Phone/mobile uniqueness:** A number stored as `phone` for one user cannot be used as `mobile` for another user, and vice versa.
- **Email uniqueness:** Email is optional but must be unique if provided. Stored as `NULL` when omitted — multiple users with no email are permitted.
- **Photo URL:** The `photo` field in all responses is an absolute URL including the server hostname.
- **Username format:** Alphanumeric, ≥4 letters and ≥4 digits, no spaces or special characters. Chosen by the user at registration.
- **Atomic registration:** User creation and profile creation happen in a single database transaction. If anything fails, no partial data is saved.
