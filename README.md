# Notes — Secure Note-Taking Application

A full-stack note-taking platform with secure authentication and role-based access control.
This repository contains both halves of the project:

| Folder | What it is | Stack | Port |
| ------ | ---------- | ----- | ---- |
| [`notes-api/`](./notes-api) | REST API | Node.js, Express 5, MongoDB, Mongoose, JWT | `3000` |
| [`notes-ui/`](./notes-ui) | Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui, TanStack Query, Zustand | `3001` |

The UI is built on my own personal Next.js setup (shadcn/ui, TanStack Query, Zustand).
All pages, API integration and role handling were written for this task.

---

## 1. Core objective

A note-taking platform with secure authentication and role-based access control.

### Roles and permissions

| Role | Access |
| ---- | ------ |
| **user** | Create, update, delete and list **their own** notes. Create posts. Read their own profile. |
| **admin** | Everything a user can do, plus: manage users (add / list / update / remove), and view **everyone's** notes. |

Roles are fixed to `user` and `admin` (`enum` in the `User` schema). Access is enforced
**server-side** in middleware — the UI only mirrors it (hiding nav items, gating pages) so
the experience matches the rules. The `/api/upload` routes are the one exception; they are
called out explicitly below.

Verified behaviour:

| Case | Result |
| ---- | ------ |
| User → `GET /api/users`, `POST /api/users`, `DELETE /api/users/:id` | `403` |
| User → another user's note `GET` / `PUT` / `DELETE` | `403` |
| User → `GET /api/notes` | only their own notes |
| Admin → `GET /api/notes` | all notes |
| Anonymous → any protected route | `401` |
| Anonymous → `/api/upload/*` | **allowed — known gap, see [File upload](#file-upload--apiupload)** |

### Security

- Passwords hashed with **bcrypt** (10 salt rounds) in a `pre('save')` hook, and the field
  is `select: false` so it can never leak into a query result or an API response.
- Stateless **JWT** (`Authorization: Bearer <token>`) signed with `{ id, role }`.
- `JWT_SECRET` is randomly generated and lives only in `.env`, which is git-ignored.
- Ownership is re-checked on every single-note read, update and delete — not just on the list.
- Self-registration can never escalate: the controller never forwards a `role`, the service
  hard-codes `role: 'user'`.

---

## 2. Tech stack

**API** — MongoDB with **Mongoose** (every index declared with `schema.index()`), **JWT**
(`jsonwebtoken`), **bcrypt**, Express 5, plus Socket.io and Multer + Sharp for rooms and
file uploads.

**UI** — Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4 + shadcn/ui,
TanStack Query (data fetching + cursor pagination), Zustand (persisted session),
Axios (Bearer interceptor), sonner (toasts).

---

## 3. Project structure

```
notes/
├── README.md            # this file
├── notes-api/           # REST API
│   ├── src/
│   │   ├── config/      # db, paths, socket.io
│   │   ├── controllers/ # auth, note, post, user, upload
│   │   ├── middleware/  # auth, error handler, async wrapper, upload
│   │   ├── models/      # Mongoose models + schema.index()
│   │   ├── routes/      # /api/auth, /api/notes, /api/posts, /api/users, /api/upload
│   │   ├── seeds/       # admin seeding script
│   │   ├── services/    # auth, note, post, user, upload
│   │   ├── utils/       # ApiResponse, ApiError, pagination, interest normalisation
│   │   ├── app.js       # Express app
│   │   └── index.js     # entry point (HTTP + Socket.io)
│   └── README.md
└── notes-ui/            # Frontend
    ├── src/
    │   ├── app/         # App Router pages
    │   ├── components/  # shadcn/ui, auth guards, layout, providers
    │   ├── config/      # site + navigation
    │   ├── features/    # auth, notes, posts, users, interests
    │   ├── hooks/       # cursor pagination, debounce
    │   └── lib/         # axios api-client, error helpers
    └── README.md
```

---

## 4. Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string

### Step 1 — API (port 3000)

```bash
cd notes-api
npm install
cp .env.example .env
```

Generate a real JWT secret (never commit `.env` — it is git-ignored):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste it into `JWT_SECRET`, then:

```bash
npm run seed:admin   # optional: creates the first admin from ADMIN_SEED_* vars
npm run dev          # http://localhost:3000  (routes mounted under /api)
```

### Step 2 — UI (port 3001)

```bash
cd notes-ui
npm install
cp .env.example .env   # already points at http://localhost:3000
npm run dev            # http://localhost:3001
```

| Variable | Value | Purpose |
| -------- | ----- | ------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | API base URL (`/api` is appended in the axios client) |
| `PORT` | `3001` | Port the Next.js dev server binds to |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3001` | Client-side URL building |

> The API reads allowed origins from `CORS_ORIGIN` and **must include the UI port**:
> `CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:5173`.
> It cannot be `*`, because the server sends `credentials: true` and browsers reject
> credentialed CORS responses for the wildcard origin.

### Step 3 — Sign in

Register at `/register` (always creates a `user`, and can set optional interests), or use
the seeded admin from `notes-api/.env` (`ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`).

---

## 5. API overview

Every response uses one envelope:

```jsonc
// success
{ "success": true, "message": "Success", "data": { } }

// paginated list
{ "success": true, "message": "Success", "data": [], "meta": { "nextCursor": null, "hasMore": false } }

// error
{ "success": false, "status": 400, "message": "Title is required" }
```

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/api/auth/register` | public | Create an account (`name`, `email`, `password`, `interests`) — role is always `user` |
| POST | `/api/auth/login` | public | Returns `{ token, user }` |
| GET | `/api/auth/me` | bearer | Current user profile |

### Notes — `/api/notes` (all require a bearer token)

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/notes` | Own notes for a user; **all** notes for an admin |
| POST | `/api/notes` | Create note (`title`, `content`) |
| GET | `/api/notes/:id` | One note (owner or admin) |
| PUT | `/api/notes/:id` | Update note (owner or admin) |
| DELETE | `/api/notes/:id` | Delete note (owner or admin) |

### Posts — `/api/posts`

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/api/posts` | public | All posts, paginated, each with the author's name |
| GET | `/api/posts/:id` | public | One post, with the author's name |
| POST | `/api/posts` | bearer | Create post; author is always the caller |
| GET | `/api/users/:id/posts` | public | **A user's posts via one `$lookup` aggregation**, plus the resolved `author` |

### Users — `/api/users` (admin only, except the first route)

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/users/:id/posts` | Public — a user's posts |
| GET | `/api/users` | List all users |
| GET | `/api/users/grouped-by-interests` | **Users grouped by interests via one `aggregate()` call** |
| POST | `/api/users` | Create user (`name`, `email`, `password`, `role`, `interests`) |
| GET | `/api/users/:id` | One user |
| PUT | `/api/users/:id` | Update user (`name`, `email`, `role`, `interests`) |
| DELETE | `/api/users/:id` | Delete user |

### Pagination

Every list endpoint is cursor-paginated — `limit` (default 10, max 50) and `after` (the
`_id` of the last item you received). Results are sorted by `_id` descending. An invalid
`after` cursor returns `400 Invalid cursor`.

```bash
GET /api/notes?limit=10
GET /api/notes?limit=10&after=507f1f77bcf86cd799439011
```

```jsonc
{
  "success": true,
  "data": [],
  "meta": { "nextCursor": "507f1f77bcf86cd799439011", "hasMore": true }
}
```

---

## 6. Database indexing strategy

Only **four** indexes are defined — every list and read access path is covered, and nothing
extra is created. All are declared with `schema.index()` so they are visible during review.

| Index | Model | Supports |
| ----- | ----- | -------- |
| `{ email: 1 }` unique | User | Login lookup by email + uniqueness constraint |
| `{ interests: 1 }` multikey | User | The `$match { interests: ... }` stages in the group-by-interests pipeline |
| `{ owner: 1, _id: -1 }` | Note | A user's own-notes list (filter by owner, sort by `_id` desc) |
| `{ author: 1, _id: -1 }` | Post | The `$lookup` in the user-posts pipeline (`foreignField: author`, sorted by `_id` desc) |

**No further indexes are needed** — the default `_id` index already serves every other
access path: admin listing all notes, admin listing all users, the public posts list, and
every `GET /:id` by primary key (the planner reports `IDHACK` for those).

Verified query plans (`explain("executionStats")`):

```
own-notes list     -> IXSCAN: owner_1__id_-1
admin all notes    -> IXSCAN: _id_
admin all users    -> IXSCAN: _id_
login by email     -> IXSCAN: email_1
note / user by _id -> IDHACK  (_id_ default)
public posts list  -> IXSCAN: _id_
Scenario 1 (filtered) -> IXSCAN: interests_1  (isMultiKey: true)
Scenario 2 $lookup     -> indexesUsed: ["author_1__id_-1"], collectionScans: 0
```

---

## 7. Aggregation pipelines

### Scenario 1 — group users by interests

`GET /api/users/grouped-by-interests` (optional `?interest=chess`) — exactly **one**

```
[$match { interests: <q> }        (only with ?interest=)   <- index-backed
  -> $project { name, interests }
  -> $unwind  "$interests"
  -> $match  { interests: <q> }    (only with ?interest=)   <- see note
  -> $group   { _id: "$interests", count: { $sum: 1 }, users: { $push: { _id, name } } }
  -> $sort    { count: -1 }
```

The filter is applied **twice inside the same single call**: before `$unwind` so the
multikey index narrows the scanned documents, and again after `$unwind` — because `$unwind`
explodes *every* interest a matching user has, so without the second `$match` the response
would also contain those other interest groups. Interests are stored lower-cased, so the
`$match` stays an exact equality and remains index-eligible.

```jsonc
[
  { "_id": "chess",  "count": 2, "users": [ { "_id": "…", "name": "…" } ] },
  { "_id": "hiking", "count": 1, "users": [ { "_id": "…", "name": "…" } ] }
]
```

### Scenario 2 — a user's posts via `$lookup`

`GET /api/users/:id/posts` — a single `User.aggregate()` pipeline with one `$lookup` stage:

```
$match  { _id: <userId> }                     (400 if not a valid ObjectId)
  -> $lookup {
       from: 'posts',
       localField: '_id',
       foreignField: 'author',
       as: 'posts',
       pipeline: [
         $match { _id: { $lt: after } }   (only when a cursor is sent)
         $sort  { _id: -1 }
         $limit <limit + 1>                (+1 detects hasMore)
         $project { __v: 0 }               (aggregation returns plain objects)
       ]
     }
  -> $project { _id, name, posts }
```

Returns `404` if the user does not exist, and otherwise the standard
`{ data, meta: { nextCursor, hasMore } }` envelope plus an `author: { _id, name }` sibling
field — the `$project` already pulled the author's id and name out of the pipeline, so the
client renders the name without a second request.

```jsonc
{
  "success": true,
  "data": [ /* posts */ ],
  "meta": { "nextCursor": "…", "hasMore": true },
  "author": { "_id": "…", "name": "Ana Rahman" }
}
```

### Other aggregations

`GET /api/posts` and `GET /api/posts/:id` also use `Post.aggregate()` with a `$lookup` into
`users` (projecting `name` only, so no email or role ever leaks) instead of a second
populate round-trip. These are not part of the two required scenarios.

---

## 8. Frontend pages

| Route | Access | Purpose |
| ----- | ------ | ------- |
| `/login`, `/register` | public | Register creates a `user` (optional interests) and links to sign in; login stores the token |
| `/dashboard/notes` | user + admin | Cursor-paginated notes with create, edit and delete. Admins see all notes, each card shows the owner. |
| `/dashboard/posts` | user + admin | Create a post, plus two lists: **All posts** (`GET /api/posts`, every post with its author's name) and **a user's posts** — your own, or anyone's via a name dropdown for admins, with that user's email and id shown underneath. |
| `/dashboard/users` | **admin** | Paginated users with create, edit and delete (delete disabled for yourself) |
| `/dashboard/interests` | **admin** | Users grouped by interest, with an `?interest=` filter and a per-group count |

The API is the single source of truth for permissions; the UI mirrors it by hiding admin
nav items and redirecting non-admins away from admin pages. On any `401` the session is
cleared and the browser is redirected to `/login` (this API has no refresh endpoint).

See [`notes-ui/README.md`](./notes-ui/README.md) for the UI-specific details.

---

## 9. Scripts

**notes-api**

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the dev server with nodemon |
| `npm start` | Start the server |
| `npm run seed:admin` | Create the admin user from `ADMIN_SEED_*` env vars |
| `npm run pm2:start:prod` | Run under PM2 in production mode |
| `npm run pm2:stop` | Stop the PM2 process |

**notes-ui**

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
