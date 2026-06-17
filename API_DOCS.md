# API Documentation

Base URL: `http://<your-server>/api`

All responses are JSON. Registration requests must be sent as `multipart/form-data`.

---

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/states/` | List all states |
| GET | `/api/cities/` | List cities for a state |
| POST | `/api/register/` | Create a new user profile |
| GET | `/api/users/` | List users with filtering and pagination |

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

Returns all states. No parameters.

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

Returns cities belonging to a given state.

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

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Max 25 characters |
| `gender` | string | Yes | `M` or `F` |
| `birth_date` | string | Yes | Format: `DD/MM/YYYY`. Cannot be a future date |
| `state_id` | integer | Yes | ID from `GET /api/states/` |
| `phone` | string | Conditional | Exactly 10 digits. At least one of `phone` or `mobile` required. Unique across all users (cross-checked against `mobile` too) |
| `mobile` | string | Conditional | Exactly 10 digits. At least one of `phone` or `mobile` required. Unique across all users (cross-checked against `phone` too) |
| `email` | string | No | Must be valid email format if provided |
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
}
```

> `city` is `null` if not provided. `photo` is `null` if not uploaded. `state` and `city` are returned as name strings, not IDs.

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
    "email": "Invalid email format.",
    "photo": "Photo must be in JPG or PNG format."
  }
}
```

---

## 4. List Users

`GET /api/users/`

Returns a paginated, filterable, sortable list of user profiles. Supports sparse fieldsets to limit response size.

### Filtering

| Parameter | Type    | Description                                      |
|-----------|---------|--------------------------------------------------|
| `name`    | string  | Case-insensitive partial match. E.g. `?name=raj` |
| `state`   | integer | Filter by state ID. E.g. `?state=2`              |
| `gender`  | string  | `M` or `F`                                       |

### Sorting

| Parameter  | Type   | Description                              |
|------------|--------|------------------------------------------|
| `ordering` | string | Field to sort by. Default: `-created_at` |

Sortable fields: `name`, `gender`, `birth_date`, `email`, `mobile`, `phone`, `state`, `city`, `created_at`

- Prefix with `-` for descending: `?ordering=-name`
- Comma-separate for multi-field: `?ordering=state,-name`
- Sorting on `name`, `email`, `state`, and `city` is **case-insensitive**
- `state` and `city` sort by their display name, not their ID

### Pagination

| Parameter   | Type    | Description                                 |
|-------------|---------|---------------------------------------------|
| `page`      | integer | Page number. Default: `1`                   |
| `page_size` | integer | Results per page. Default: `10`. Max: `100` |

### Sparse Fieldsets

| Parameter | Type   | Description                                            |
|-----------|--------|--------------------------------------------------------|
| `fields`  | string | Comma-separated field names to include in the response |

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
- **Hobbies on write:** Send as repeated `hobbies_ids` fields using the hobby name as the value.
- **Hobbies on read:** Returned as an array of objects `[{ "id": 1, "name": "cricket" }]`.
- **Photo URL:** The `photo` field in responses is an absolute URL.
- **Optional string fields:** Not provided will be returned as `""`. Optional FK fields not provided will be returned as `null`.
