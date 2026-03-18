# Project

```
frontend/     → Frontend app
backend/      → Backend API
shared/       → Shared constants, types, validation schemas
contracts/    → API contract (source of truth for frontend↔backend)
```

## Contracts

- `contracts/API.md` is the single source of truth for the API. Both frontend and backend must match it.
- Update it when anything changes — don't let it go stale.
- All request/response bodies are JSON. Use standard HTTP status codes.

## Frontend

- Build against mocked data first to avoid being blocked by backend.
- Keep the API client in one place for easy mock→real switching.
- Small, focused components.
- Reference skills available under `frontend/.claude/skills/`

## Backend

- Implement endpoints as defined in `contracts/API.md`.
- Enable CORS for the frontend dev server origin.
- Seed the database with test data early so frontend has something to work with.

## Shared

- Only add things here if they're genuinely used by both frontend and backend.
- Good candidates: constants, enums (status values, role types), validation schemas, type definitions, non-secret config.
- Keep it lightweight — no separate build step.
- If frontend and backend use different languages, this may just be a reference document.
