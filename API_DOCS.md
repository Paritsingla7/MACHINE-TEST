# API Documentation

Base URL: `http://<your-server>/api`

All responses are JSON. Registration requests must be sent as `multipart/form-data`.

---

## Endpoints

| Method | Endpoint | Auth required | Description |
| --- | --- | --- | --- |
| GET | `/api/states/` | No | List all states |
| GET | `/api/cities/` | No | List cities for a state |
| POST | `/api/register/` | No | Create a new user profile — returns JWT tokens |
| POST | `/api/login/` | No | Login with username + password — returns JWT tokens |
| POST | `/api/token/refresh/` | No | Exchange a refresh token for a new access token |
| GET | `/api/me/` | Bearer token | Get the profile of the authenticated user |
| GET | `/api/users/` | Admin only | List user profiles with filtering and pagination |

---

## Authentication

This API uses JWT (JSON Web Token) authentication via `djangorestframework-simplejwt`.

Include the access token in the `Authorization` header for protected endpoints:

```
Authorization: Bearer <access_token>
```

Access tokens expire (default 5 minutes). Use the refresh token to get a new one without logging in again.

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

Only fields that failed validation appear in `errors`. Keys are field names except for `contact`, which is used when neither `phone` nor `mobile` is provided.

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

Returns cities belonging to a given state. No authentication required.

**Query parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `state_id` | integer | Yes | ID of the selected state |

**Response `200 OK`:**
```json
[
  { "id": 1, "name": "Mumbai" },
  { "id": 2, "name": "Pune" }
]
```

**Response `400 Bad Request`:**
```json
{ "error": "state_id query parameter is required." }
```
```json
{ "error": "state_id must be a valid integer." }
```

---

## 3. Register User

`POST /api/register/`

Creates a new user profile and a linked Django auth user. Returns JWT tokens immediately so the client is authenticated right after registration. No prior authentication required.

**Content-Type:** `multipart/form-data`

### Register — Request Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | Yes | Max 25 characters |
| `password` | string | Yes | Min 8 characters. Used to log in later |
| `gender` | string | Yes | `M` or `F` |
| `birth_date` | string | Yes | Format: `DD/MM/YYYY`. Cannot be a future date |
| `state_id` | integer | Yes | ID from `GET /api/states/` |
| `phone` | string | Conditional | Exactly 10 digits. At least one of `phone` or `mobile` required. Unique across all users (cross-checked against `mobile` too) |
| `mobile` | string | Conditional | Exactly 10 digits. At least one of `phone` or `mobile` required. Unique across all users (cross-checked against `phone` too) |
| `email` | string | No | Must be valid email format if provided. Unique across all users. Stored as NULL if omitted |
| `city_id` | integer | No | ID from `GET /api/cities/`. Must belong to the selected state |
| `hobbies_ids` | string (repeatable) | No | Send as repeated field. Values are hobby names (e.g. `cricket`, `chess`) |
| `photo` | file | No | JPG or PNG only |

**Hobbies example (multipart):**
```
hobbies_ids=cricket
hobbies_ids=chess
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
    "mobile": "",
    "state": "Maharashtra",
    "city": "Pune",
    "hobbies": [
      { "id": 3, "name": "chess" },
      { "id": 4, "name": "cricket" }
    ],
    "photo": "http://<server>/media/profile_photos/jane.jpg",
    "created_at": "2024-06-15T10:30:00Z"
  },
  "username": "janedoe3842",
  "access": "<jwt-access-token>",
  "refresh": "<jwt-refresh-token>"
}
```

> **Important:** Save the `username` on the client. It is an auto-generated string (e.g. `janedoe3842`) and is the only way to log in later. It is not shown anywhere else after this response.

### Response `400 Bad Request`

```json
{
  "errors": {
    "name": "Name cannot exceed 25 characters.",
    "password": "This field is required.",
    "birth_date": "Birth date cannot be in the future.",
    "gender": "Gender must be either \"M\" for male or \"F\" for female",
    "contact": "At least one contact number (phone or mobile) must be provided.",
    "phone": "Phone number must be 10 digits long.",
    "mobile": "This mobile number is already registered.",
    "email": "This email address is already registered.",
    "state": "State must be selected.",
    "city": "City must belong to the selected state.",
    "photo": "Photo must be in JPG or PNG format."
  }
}
```

---

## 4. Login

`POST /api/login/`

Exchange a username and password for a JWT token pair. No prior authentication required.

**Content-Type:** `application/json` or `multipart/form-data`

### Login — Request Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `username` | string | Yes | The auto-generated username returned at registration |
| `password` | string | Yes | The password set at registration |

### Login — Response `200 OK`

```json
{
  "access": "<jwt-access-token>",
  "refresh": "<jwt-refresh-token>"
}
```

### Login — Response `401 Unauthorized`

```json
{
  "detail": "No active account found with the given credentials"
}
```

---

## 5. Refresh Token

`POST /api/token/refresh/`

Get a new access token using a valid refresh token. Use this when the access token expires instead of asking the user to log in again.

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

## 6. Get My Profile

`GET /api/me/`

Returns the profile of the currently authenticated user.

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
  "mobile": "",
  "state": "Maharashtra",
  "city": "Pune",
  "hobbies": [
    { "id": 3, "name": "chess" }
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

---

## 7. List Users

`GET /api/users/`

Returns a paginated, filterable, sortable list of user profiles. Supports sparse fieldsets to limit response size.

**Authentication:** Required — Admin users only (`IsAdminUser`). Returns `403 Forbidden` for non-admin authenticated users and `401 Unauthorized` for unauthenticated requests.

### Filtering

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | string | Case-insensitive partial match. E.g. `?name=raj` |
| `state` | integer | Filter by state ID. E.g. `?state=2` |
| `gender` | string | `M` or `F` |

### Sorting

| Parameter | Type | Description |
| --- | --- | --- |
| `ordering` | string | Field to sort by. Default: `-created_at` |

Sortable fields: `name`, `gender`, `birth_date`, `email`, `mobile`, `phone`, `state`, `city`, `created_at`

- Prefix with `-` for descending: `?ordering=-name`
- Comma-separate for multi-field: `?ordering=state,-name`
- Sorting on `name`, `email`, `state`, and `city` is **case-insensitive**
- `state` and `city` sort by their display name, not their ID

### Pagination

| Parameter | Type | Description |
| --- | --- | --- |
| `page` | integer | Page number. Default: `1` |
| `page_size` | integer | Results per page. Default: `10`. Max: `100` |

### Sparse Fieldsets

| Parameter | Type | Description |
| --- | --- | --- |
| `fields` | string | Comma-separated field names to include in the response |

Available field names: `id`, `name`, `gender`, `birth_date`, `email`, `phone`, `mobile`, `state`, `city`, `hobbies`, `photo`, `created_at`

Always include `id` to keep results identifiable. Example: `?fields=id,name,state,created_at`

**Response `200 OK`:**
```json
{
  "count": 42,
  "next": "http://<server>/api/users/?page=2",
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
      "state": "Maharashtra",
      "city": "Mumbai",
      "hobbies": [
        { "id": 1, "name": "cricket" },
        { "id": 2, "name": "chess" }
      ],
      "photo": "http://<server>/media/profile_photos/john.jpg",
      "created_at": "2024-06-15T10:30:00Z"
    }
  ]
}
```

> `next` and `previous` are `null` when there is no adjacent page. `photo` is `null` if no photo was uploaded. `state` and `city` are name strings, not IDs. `hobbies` is an array of `{ "id", "name" }` objects.

---

## Notes

- **Date format:** All dates — both sent and received — use `DD/MM/YYYY`.
- **Write vs read field names:** Registration accepts `state_id` and `city_id` (IDs). Responses return `state` and `city` as name strings.
- **Phone/mobile uniqueness:** A number already stored as `phone` for one user cannot be used as `mobile` for another, and vice versa.
- **Email uniqueness:** Email is optional but must be unique if provided. Stored as `NULL` (not empty string) when omitted — multiple users with no email are allowed.
- **Hobbies on write:** Send as repeated `hobbies_ids` fields using the hobby name as the value.
- **Hobbies on read:** Returned as an array of objects `[{ "id": 1, "name": "cricket" }]`.
- **Photo URL:** The `photo` field in responses is an absolute URL.
- **Optional string fields:** Not provided will be returned as `""`. Optional FK fields not provided will be returned as `null`.
- **Username:** Auto-generated at registration as `<lowercasename><4-digit-random>` (e.g. `paritsingla4821`). Not shown in the profile — only returned once at registration.
