# API Contract

This file is the source of truth for the interface between frontend and backend. **Update it when things change** — don't let it go stale.

---

## Conventions

- Base URL: `http://localhost:<PORT>/api` (update with your actual port)
- All request/response bodies are JSON
- Use standard HTTP status codes
- Auth: [Describe your auth approach here, e.g., Bearer token, session cookie, none]

## Endpoint Template

Copy this template for each new endpoint:

```
### [Short description]

`METHOD /path`

**Request body:**
```json
{
  "field": "type — description"
}
```

**Response (200):**
```json
{
  "field": "type — description"
}
```

**Errors:**
- `400` — [when]
- `401` — [when]
- `404` — [when]
```

---

## Endpoints

### Example: Create a widget

`POST /widgets`

**Request body:**
```json
{
  "name": "string — display name for the widget",
  "type": "string — one of: basic, premium"
}
```

**Response (201):**
```json
{
  "id": "string — unique identifier",
  "name": "string",
  "type": "string",
  "createdAt": "string — ISO 8601 timestamp"
}
```

**Errors:**
- `400` — Missing or invalid fields
- `401` — Not authenticated

---

<!-- Add your endpoints below -->

---

## Shared Models

Define data shapes that appear across multiple endpoints.

```
### ModelName

| Field     | Type   | Description          |
|-----------|--------|----------------------|
| id        | string | Unique identifier    |
| createdAt | string | ISO 8601 timestamp   |
```

<!-- Add your models below -->
