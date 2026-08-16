# Secure Note-Taking Application

A secure note-taking platform with JWT authentication, role-based access control, MongoDB indexing, aggregation pipelines, and paginated APIs.

The visual style is intentionally simple. The focus is backend correctness, security, and reusable integration.

## Tech stack

### Backend (`note-taking-backend`)

- Node.js, Express.js, TypeScript
- MongoDB, Mongoose
- JWT, bcrypt
- Zod validation
- Helmet, CORS, HPP, rate limiting

### Frontend (`note-taking-frontend`)

- Next.js App Router, TypeScript, Tailwind CSS
- Redux Toolkit Query (existing client layer)
- shadcn/ui, Lucide React, React Icons

The existing project already used Redux, not Zustand. Redux is kept so the installed stack is not replaced.

## Setup

### 1. Backend

```bash
cd note-taking-backend
cp .env.example .env
npm install
npm run dev
```

The API listens on `PORT` (default `8010`) with prefix `/api/v1`.

### 2. Frontend

```bash
cd note-taking-frontend
npm install
npm run dev
```

Set:

```env
NEXT_PUBLIC_API_URL=http://localhost:8010
NEXT_PUBLIC_API_KEY=<same value as backend VALID_API_KEYS>
```

### 3. Seeded admin

On first boot the backend creates an ADMIN from:

- `ADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`

## Environment variables

Backend uses the existing env names (not hardcoded secrets):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MongoDB connection string (`MONGODB_URI` equivalent) |
| `JWT_SECRET` | Access token secret |
| `EXPIRES_IN` | Access token expiry (`JWT_EXPIRES_IN` equivalent) |
| `REFRESH_TOKEN_SECRET` | Refresh token secret |
| `VALID_API_KEYS` | Required `x-api-key` header in non-test environments |
| `PORT` | HTTP port |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `END_POINT_PREFIX` | API prefix, `/api/v1` |
| `ADMIN_EMAIL` / `SUPERADMIN_PASSWORD` | Bootstrap admin |

See `.env.example` for the full list required by the existing config schema.

Non-GET requests from the frontend should send:

- `x-api-key`
- `x-secret-type: ACCESS` (optional; ACCESS is the default)
- `Authorization: Bearer <token>` or the httpOnly `accessToken` cookie

## Authentication

```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

- Passwords are hashed with bcrypt and stored with `select: false`.
- Public registration always creates `USER`. Supplying `role: ADMIN` is rejected.
- JWT payload includes `userId`, `id`, `email`, and `role`.
- Password hashes are never returned.

## Authorization

Reusable middleware:

- `auth()` / `requireAuth` — JWT required
- `auth("ADMIN")` / `requireRole("ADMIN")` — role check

Flow: request → JWT verification → load user from DB → role check → controller.

Ownership is taken from the JWT, never from a client-supplied `userId`.

| Actor | Notes | Admin APIs |
| --- | --- | --- |
| USER | CRUD own notes only | 403 |
| ADMIN | All USER capabilities plus all notes and user management | allowed |

## API endpoints

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Notes

- `POST /api/v1/notes`
- `GET /api/v1/notes?page=1&limit=10`
- `GET /api/v1/notes/:id`
- `PATCH /api/v1/notes/:id`
- `DELETE /api/v1/notes/:id`

USER queries include `{ userId: authenticatedUserId }` at the database level.

### Admin users

- `GET /api/v1/admin/users?page=1&limit=10`
- `POST /api/v1/admin/users`
- `GET /api/v1/admin/users/:id`
- `PATCH /api/v1/admin/users/:id`
- `DELETE /api/v1/admin/users/:id`
- `GET /api/v1/admin/users/grouped-by-interests`

### Admin notes

- `GET /api/v1/admin/notes?page=1&limit=10`

### Posts (public `$lookup`)

- `POST /api/v1/posts` (authenticated)
- `GET /api/v1/posts/user/:userId` (public, aggregation `$lookup`)

## Pagination

Reusable helper: `paginationHelpers.calculatePagination` / `buildPagination`.

Rules:

- `page` >= 1
- `limit` >= 1
- maximum `limit` = 100

List responses:

```json
{
  "success": true,
  "message": "Notes retrieved successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Indexing strategy

Manual indexes use `schema.index()` and exist only when a real query needs them.

### User

**`email` unique index**

- Created by: `unique: true` on `email` (not a second `schema.index({ email: 1 })`)
- Query: login, duplicate-email check, `GET /auth/me`
- Why: unique constraint plus equality lookups by email

**`UserSchema.index({ createdAt: -1 })`**

- Query: `GET /admin/users` → `find({}).sort({ createdAt: -1 }).skip().limit()`
- Why: admin listing sorts all users by newest first

**Not created**

- `_id` — automatic
- `interests` — Scenario 1 is `$unwind` → `$group` over the collection. An interests index would not avoid that scan.

### Note

**`noteSchema.index({ userId: 1, createdAt: -1 })`**

- Query: `GET /notes` → `find({ userId }).sort({ createdAt: -1 }).skip().limit()`
- Why: compound index covers owner filter + newest-first sort

**`noteSchema.index({ createdAt: -1 })`**

- Query: `GET /admin/notes` → `find({}).sort({ createdAt: -1 }).skip().limit()`
- Why: admin listing has no `userId` filter, so the compound index prefix cannot be used

**Not created**

- `_id` — automatic, used by `GET /notes/:id`
- `{ _id, userId }` — a single-document `_id` lookup plus owner filter does not need another index

### Post

**`postSchema.index({ userId: 1 })`**

- Query: `$lookup` `{ from: "posts", localField: "_id", foreignField: "userId" }`
- Why: the `$lookup` foreign field must be indexed

**Not created**

- `createdAt` — there is no independent posts list sort
- `_id` — automatic

## Aggregation Scenario 1 — group by interests

Endpoint: `GET /api/v1/admin/users/grouped-by-interests`

Exactly one call:

```js
User.aggregate([
  { $unwind: "$interests" },
  { $group: { _id: "$interests", users: { $push: { _id: "$_id", name: "$name", email: "$email", role: "$role" } } } },
  { $project: { _id: 0, interest: "$_id", users: 1 } },
  { $sort: { interest: 1 } }
])
```

No `find()`, `countDocuments()`, or second aggregate. No `interests` index — the pipeline scans the collection.

## Aggregation Scenario 2 — user posts with `$lookup`

Endpoint: `GET /api/v1/posts/user/:userId`

Exactly one pipeline:

```js
User.aggregate([
  { $match: { _id: userId } },
  { $lookup: { from: "posts", localField: "_id", foreignField: "userId", as: "posts" } },
  { $project: { password: 0, tokenVersion: 0 } }
])
```

Supported by `postSchema.index({ userId: 1 })`.

## Security decisions

- bcrypt password hashing; hashes never returned (`select: false` + sanitizer)
- JWT identity is the source of ownership
- Public register cannot create ADMIN
- USER cannot access admin routes or another user's notes
- ObjectIds validated with a 24-hex pattern
- Zod validation on bodies, params, and pagination query
- Helmet, CORS, HPP, XSS sanitization, rate limiting
- API keys and JWT secrets come from environment variables
- Centralized error handler maps 400/401/403/404/409/500 without leaking internals in production

## Testing

```bash
cd note-taking-backend
npm test
```

Coverage:

- Auth: register, duplicate email, login, wrong password, missing token, invalid token
- Authorization: own notes, another user's notes, USER vs admin endpoints, ADMIN all-notes
- Notes CRUD and pagination
- Admin user CRUD
- Interests aggregation
- Posts `$lookup`
- Mongoose indexes (required indexes present, no `interests` index, no duplicate `_id` index)

## Frontend routes

- `/login`, `/signup`
- `/dashboard`, `/notes`, `/notes/new`, `/notes/:id`, `/notes/:id/edit`
- `/profile`
- `/posts/:userId`
- `/admin`, `/admin/users`, `/admin/users/new`, `/admin/users/:id`
- `/admin/notes`, `/admin/interests`
