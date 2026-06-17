# API Documentation

Base URL: `http://<your-server>/api`

All responses are JSON. All request bodies should be sent as `multipart/form-data`.

---

## Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/states/` | List all states |
| GET | `/api/cities/` | List cities for a state |
| POST | `/api/register/` | Register a new user profile |
| GET | `/api/users/` | List users with filters and pagination |

---

## Integration Flow (Android)

```
1. GET /api/states/               → populate state dropdown on form load
2. GET /api/cities/?state_id=<id> → on state selection, populate city dropdown
3. POST /api/register/            → submit registration form
4. GET /api/users/                → display user list (with optional filters)
```

---

## Error Response Format

All validation errors follow this structure — always an `errors` object with field names as keys:

```json
{
  "errors": {
    "field_name": "Error message here.",
    "another_field": "Another error message."
  }
}
```

Parse `errors` as a map and display each message next to its corresponding field.

---

## 1. List States

`GET /api/states/`

Returns all states. Call on form load to populate the state dropdown.

**No parameters.**

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

Returns cities for a given state. Call when the user selects a state.

**Query parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
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

Creates a new user profile.

**Content-Type:** `multipart/form-data`

### Request Fields

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `name` | string | Yes | Max 25 characters. Cannot be empty. |
| `gender` | string | Yes | `M` or `F` only |
| `birth_date` | string | Yes | Format: `DD/MM/YYYY`. Cannot be a future date. |
| `state` | integer | Yes | ID from `/api/states/` |
| `phone` | string | Conditional | Exactly 10 digits. At least one of `phone` or `mobile` must be provided. Must be unique across all users. |
| `mobile` | string | Conditional | Exactly 10 digits. At least one of `phone` or `mobile` must be provided. Must be unique across all users. |
| `email` | string | No | Must be a valid email format if provided |
| `city` | integer | No | ID from `/api/cities/`. Must belong to the selected `state`. |
| `hobbies` | string (repeatable) | No | Send as multiple values. Accepted: `hockey`, `chess`, `football`, `cricket` |
| `photo` | file | No | JPG or PNG only |

**Hobbies example (multipart):**
```
hobbies=cricket
hobbies=chess
```

### Response `201 Created`
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
  "photo": "http://<server>/media/profile_photos/jane.jpg"
}
```

### Response `400 Bad Request`
```json
{
  "errors": {
    "name": "Name cannot exceed 25 characters.",
    "birth_date": "Birth date cannot be in the future.",
    "gender": "Gender must be either \"M\" for male or \"F\" for female",
    "contact": "At least one contact number (phone or mobile) must be provided.",
    "phone": "Phone number must be 10 digits long.",
    "mobile": "This mobile number is already registered.",
    "state": "State must be selected.",
    "city": "City must belong to the selected state.",
    "photo": "Photo must be in JPG or PNG format."
  }
}
```

> Only fields that failed validation are included in the `errors` object. A successful registration will never return `errors`.

---

## 4. List Users

`GET /api/users/`

Returns a paginated list of registered users. Supports filtering by name, state, and gender.

**Query parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | string | No | Case-insensitive partial match on name |
| `state` | integer | No | Filter by state ID |
| `gender` | string | No | `M` or `F` |
| `page` | integer | No | Page number. Default: `1`. Page size: `10` |

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
      "state": 3,
      "city": 12,
      "hobbies": ["cricket", "chess"],
      "photo": "http://<server>/media/profile_photos/john.jpg"
    }
  ]
}
```

> `next` and `previous` are `null` when there is no next/previous page.  
> `photo` is `null` if no photo was uploaded.

---

## Validation Rules Reference

| Field | Rule |
|---|---|
| `name` | Required. Max 25 characters. |
| `gender` | Required. `M` or `F` only. |
| `birth_date` | Required. `DD/MM/YYYY` format. Cannot be in the future. |
| `state` | Required. Must be a valid state ID. |
| `phone` | Optional individually but at least one of `phone`/`mobile` is required. Digits only. Exactly 10 digits. Unique across all users. |
| `mobile` | Optional individually but at least one of `phone`/`mobile` is required. Digits only. Exactly 10 digits. Unique across all users. |
| `email` | Optional. Standard email format if provided. |
| `city` | Optional. Must belong to the selected state if provided. |
| `hobbies` | Optional. Any combination of `hockey`, `chess`, `football`, `cricket`. |
| `photo` | Optional. JPG or PNG only. |

---

## Notes

- **Date format:** All dates — both sent and received — use `DD/MM/YYYY`.
- **Phone/mobile uniqueness:** A number already used as `phone` by one user cannot be used as `mobile` by another, and vice versa. The uniqueness check is cross-field.
- **Photo URL:** The `photo` field in responses is an absolute URL. Use it directly to display the image.
- **Pagination:** Default page size is 10. Use `?page=N` to navigate.
- **Empty fields:** Optional string fields not provided will be returned as `""`. Optional FK fields not provided will be returned as `null`.

---

## Interactive Testing (Internal)

| Tool | URL |
|---|---|
| Swagger UI | `GET /api/docs/` |
| ReDoc | `GET /api/redoc/` |
| Raw OpenAPI schema | `GET /api/schema/` |
