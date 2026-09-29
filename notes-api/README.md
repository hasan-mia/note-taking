# Notes API

Secure note-taking **REST API** — Express 5, MongoDB/Mongoose, JWT authentication, and
file upload support. This is the backend half of the Notes project; the frontend lives in
[`../notes-ui`](../notes-ui) and the overview is in the [root README](../README.md).

The API listens on **port 3000** and mounts every route under `/api`.

## Features

- **Authentication** — JWT auth with register, login and current-user
- **Notes** — CRUD for personal notes; a user sees only their own, an admin sees all
- **Posts** — public, paginated posts, plus a user's posts via a `$lookup` aggregation
- **Users** — admin-only user management, and users grouped by interests
- **File upload** — images (auto WebP), videos and documents with local storage
- **Real-time** — Socket.io for room-based messaging
- **Admin seeding** — create the first admin with `npm run seed:admin`
- **Cursor pagination** on every list endpoint, backed by deliberate indexes

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm

## Quick Start

### 1. Install

```bash
cd notes-api
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

`.env` is git-ignored — never commit it. Generate a real signing secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/notes
JWT_SECRET=<paste the generated 96-char hex string>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:5173
ADMIN_SEED_NAME=Admin
ADMIN_SEED_EMAIL=admin@yourapp.com
ADMIN_SEED_PASSWORD=SecurePassword123!
```

`CORS_ORIGIN` must list the frontend origin (default `http://localhost:3001`).
It cannot be `*`, because the server sends `credentials: true` and browsers reject
credentialed CORS responses for the wildcard origin. If the variable is unset the server
falls back to `*` and browser calls from another origin will fail.

`BASE_URL` is optional and only used to build absolute links for uploaded files.

### 3. Start MongoDB

```bash
docker run -d -p 27017:27017 mongo:7     # or use MongoDB Atlas in MONGO_URI
```

### 4. Run

```bash
npm run dev             # nodemon, http://localhost:3000
npm start               # plain node
npm run pm2:start:prod  # under PM2
```

### 5. Seed an admin (optional)

```bash
npm run seed:admin
```

Creates the user described by `ADMIN_SEED_NAME` / `ADMIN_SEED_EMAIL` /
`ADMIN_SEED_PASSWORD` with role `admin`. Re-running it is safe — it exits if the user
already exists.

## Response envelope

Every response uses the same shape (`src/utils/ApiResponse.js`):

```jsonc
// success
{ "success": true, "message": "Success", "data": { }, "meta": { } }

// paginated list
{ "success": true, "message": "Success", "data": [], "meta": { "nextCursor": null, "hasMore": false } }

// error
{ "success": false, "status": 400, "message": "Title is required" }
```

The global error handler (`src/middleware/error.js`) maps Mongoose validation errors to
`400`, duplicate keys to `409`, invalid ObjectIds to `400`, and JWT errors to `401`.

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/api/auth/register` | public | Register (`name`, `email`, `password`, `interests`) — always role `user` |
| POST | `/api/auth/login` | public | Returns `{ token, user }` |
| GET | `/api/auth/me` | bearer | Current user profile |

### Notes (all require a bearer token)

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/notes` | Own notes for a user; **all** notes for an admin |
| POST | `/api/notes` | Create note (`title`, `content`) |
| GET | `/api/notes/:id` | One note (owner or admin) |
| PUT | `/api/notes/:id` | Update note (owner or admin) |
| DELETE | `/api/notes/:id` | Delete note (owner or admin) |

### Posts

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/api/posts` | public | All posts, paginated, each with the author's name |
| GET | `/api/posts/:id` | public | One post, with the author's name |
| POST | `/api/posts` | bearer | Create post; author is always the caller |
| GET | `/api/users/:id/posts` | public | A user's posts via a single `$lookup` aggregation |

### Users (admin only, except the first route)

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/users/:id/posts` | Public — a user's posts, plus the `author` already resolved by the pipeline |
| GET | `/api/users` | List all users |
| GET | `/api/users/grouped-by-interests` | Users grouped by interests (one `aggregate()` call) |
| POST | `/api/users` | Create user (`name`, `email`, `password`, `role`, `interests`) |
| GET | `/api/users/:id` | One user |
| PUT | `/api/users/:id` | Update user (`name`, `email`, `role`, `interests`) |
| DELETE | `/api/users/:id` | Delete user |

### File upload

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/upload/single` | Upload a single file (field: `file`) |
| POST | `/api/upload/multiple` | Upload multiple files (field: `files`, max 10) |
| DELETE | `/api/upload/:publicId` | Delete file |
| GET | `/api/upload/info/:filename` | Get file info |
| GET | `/api/upload/list` | List all files |

> **Known gap — these routes are not currently behind `isAuthenticated`.**
> `src/routes/uploadRoutes.js` mounts only the Multer middleware, so these five endpoints
> are reachable without a token: anyone can upload a file, list every stored file, and
> delete any file by `publicId`. Add the auth middleware to close it:
>
> ```js
> const { isAuthenticated } = require('../middleware/auth');
>
> router.post('/single', isAuthenticated, uploadSingle('file'), uploadController.uploadFile);
> ```

Uploaded files are served at `http://localhost:3000/files/{filename}`.

- **Images** — auto-converted to WebP (80% quality)
- **Videos** — stored as-is (mp4, webm, ogg, mov)
- **Documents** — PDF, DOC, DOCX, XLS, XLSX, TXT, CSV
- **Max file size** — 50MB, **max 10 files** per request

### Socket.io events

| Event | Direction | Description |
| ----- | --------- | ----------- |
| `joinRoom` | Client → Server | Join a room by `roomId` |
| `disconnect` | Client → Server | Leaves the room automatically |

## Roles and authorization

Roles are fixed to `user` and `admin` (`src/models/User.js` enum). Enforcement lives in
`src/middleware/auth.js`:

- `isAuthenticated` — verifies the `Authorization: Bearer <token>` header, loads
  `{ id, role }` onto `req.user`, `401` otherwise
- `requireRole('admin')` — `403` unless the token's role matches

Routes apply them as follows:

- `/api/notes/*` → `isAuthenticated`; ownership is re-checked on read, update and delete
  (owner or admin), and `listNotes` returns every note for an admin
- `/api/users/*` → `isAuthenticated` + `requireRole('admin')`
- `/api/posts` `POST` → `isAuthenticated`; the author is always `req.user.id`
- `GET /api/users/:id/posts` → public (declared before the admin-only middleware)

## Security

- **Password hashing** — `bcrypt` with 10 salt rounds, applied in a `pre('save')` hook,
  and the field is `select: false` so it never leaves the database by accident.
- **Password-free responses** — the `User` schema has a `toJSON` transform that deletes
  `password` and `__v`; `Note` and `Post` do the same for `__v`. The `$lookup` aggregation
  returns plain objects, so it strips `__v` with an explicit `$project`.
- **JWT** — signed with `{ id, role }`, expiry from `JWT_EXPIRES_IN` (default `7d`).
  There is no refresh endpoint: a `401` means sign in again.
- **No secrets in version control** — `.env` is git-ignored; `.env.example` only carries
  placeholders.
- **Ownership checks** — a user cannot read, edit or delete another user's note even with
  a valid token (`403`).
- **No role escalation** — `POST /api/auth/register` never forwards a caller-supplied
  `role`; the service hard-codes `role: 'user'`.
- **Interest normalisation** (`src/utils/interests.js`) — the same rule applies to
  registration and admin user management: trim, lowercase, drop blanks, strip a leading
  `$` so a stored value can never be read as a field path by the group-by-interests
  pipeline, cap at 30 characters each and 10 entries, and de-duplicate.

## Pagination

Cursor-based pagination on every list endpoint, implemented in `src/utils/pagination.js`:

- `limit` — items per page (default `10`, max `50`)
- `after` — the `_id` of the last item received; returns items with `_id < after`

Results are always sorted by `_id` descending.

```bash
GET /api/posts?limit=10
GET /api/posts?limit=10&after=507f1f77bcf86cd799439011
```

```jsonc
{
  "success": true,
  "data": [],
  "meta": { "nextCursor": "507f1f77bcf86cd799439011", "hasMore": true }
}
```

An invalid `after` cursor returns `400 Invalid cursor`.

Two helpers cover the whole API, both in `src/utils/pagination.js`:

- `parsePaginationParams(query)` — reads and clamps `limit` (default 10, max 50) and
  reads `after`.
- `paginate(baseQuery, params)` — applies the cursor to a Mongoose query, used by the
  notes and users services.

The post services need the pagination inside an aggregation stage, so they use
`parsePaginationParams` plus a local `parseCursor` (which returns `400 Invalid cursor`)
and `buildPage` (fetches `limit + 1` rows and derives `hasMore` / `nextCursor` from the
extra row). The result is identical to `paginate` on every list endpoint.

## Indexing strategy

Four indexes total — every list and read access path is covered and nothing extra exists.
All are declared with `schema.index()` so they are visible during review.

| Index | Where | Why it is required |
| ----- | ----- | ------------------ |
| `{ email: 1 }` unique | `src/models/User.js:63` | Login lookup by email, plus the uniqueness constraint |
| `{ interests: 1 }` multikey | `src/models/User.js:66` | The `$match { interests: ... }` stages in the group-by-interests pipeline |
| `{ owner: 1, _id: -1 }` | `src/models/Note.js:28` | A user's own-notes list: filter by owner, sort by `_id` desc, cursor-page through it |
| `{ author: 1, _id: -1 }` | `src/models/Post.js:27` | The `$lookup` in the user-posts pipeline resolves on `foreignField: 'author'` and sorts by `_id` desc |

No other indexes are defined, because the default `_id` index already covers the rest:

- admin listing all notes (`find({}).sort({ _id: -1 })`)
- admin listing all users (`find({}).sort({ _id: -1 })`)
- the public posts list (`$match {} → $sort { _id: -1 } → $limit`)
- every `GET /:id` by primary key (the planner reports `IDHACK`)

There is no full-text search, geo query, or any other access pattern in this API that
would justify a further index.

Verified plans via `explain("executionStats")`:

```
own-notes list        -> IXSCAN: owner_1__id_-1
admin all notes       -> IXSCAN: _id_
admin all users       -> IXSCAN: _id_
login by email        -> IXSCAN: email_1
note / user by _id    -> IDHACK  (_id_ default)
public posts list     -> IXSCAN: _id_
posts by author       -> IXSCAN: author_1__id_-1
Scenario 1 (filtered) -> IXSCAN: interests_1  (isMultiKey: true)
Scenario 2 $lookup    -> indexesUsed: ["author_1__id_-1"], collectionScans: 0
```

## Aggregations

Four pipelines in total: the two required scenarios, plus the `$lookup` used by the public
posts endpoints to resolve the author's name without a second round-trip.

### Scenario 1 — users grouped by interests

`GET /api/users/grouped-by-interests` · `src/services/userService.js` · `groupUsersByInterests`

Exactly **one** `User.aggregate()` call — no `find()`, no `distinct()`, no second query.

```
[$match { interests: <q> }          (only when ?interest= is given)  <- index-backed
  -> $project { name, interests }
  -> $unwind  "$interests"
  -> $match  { interests: <q> }      (only when ?interest= is given)  <- see note
  -> $group   { _id: "$interests", count: { $sum: 1 }, users: { $push: { _id, name } } }
  -> $sort    { count: -1 }
```

```jsonc
[
  { "_id": "chess",  "count": 2, "users": [ { "_id": "…", "name": "…" } ] },
  { "_id": "hiking", "count": 1, "users": [ { "_id": "…", "name": "…" } ] }
]
```

The filter is applied **twice on purpose**, both inside the same single `aggregate()`
call:

- The **first** `$match` runs before `$unwind` so the multikey `{ interests: 1 }` index
  narrows the documents that are scanned.
- The **second** `$match` runs after `$unwind`, because `$unwind` explodes *every*
  interest a matching user has. Without it, `?interest=chess` would also return the
  `reading` and `hiking` groups belonging to those same users.

Without the filter the pipeline necessarily reads the whole (small) user collection in
order to group it.

### Scenario 2 — a user's posts via `$lookup`

`GET /api/users/:id/posts` · `src/services/postService.js` · `getUserPosts`

A single `User.aggregate()` pipeline containing one `$lookup` stage:

```
$match  { _id: <userId> }                       (400 if the id is not a valid ObjectId)
  -> $lookup {
       from: 'posts',
       localField: '_id',
       foreignField: 'author',
       as: 'posts',
       pipeline: [
         $match { _id: { $lt: after } }   (only when a cursor is sent)
         $sort  { _id: -1 }
         $limit <limit + 1>               (+1 detects hasMore)
         $project { __v: 0 }              (aggregation returns plain objects)
       ]
     }
  -> $project { _id, name, posts }
```

Returns `404 User not found` when the user does not exist, and otherwise the standard
`{ data, meta: { nextCursor, hasMore } }` envelope, with one extra sibling field: the
`$project` already carried the author's id and name out of the pipeline, so they are
returned instead of being thrown away — the client then needs no second (admin-only)
request just to render a name.

```jsonc
{
  "success": true,
  "message": "Success",
  "data": [ /* posts */ ],
  "meta": { "nextCursor": "…", "hasMore": true },
  "author": { "_id": "…", "name": "Ana Rahman" }
}
```

The planner reports `indexesUsed: ["author_1__id_-1"]` with `collectionScans: 0`.

A runtime check of the constraint — profiling MongoDB for a single request to
`/api/users/grouped-by-interests` shows **one** operation on the `users` collection:

```
command -> aggregate
TOTAL on users: 1
```

### Posts endpoints — author name via `$lookup`

`listPosts` and `getPost` in `src/services/postService.js` use a shared `authorStages`
fragment instead of a populate round-trip:

```
$match (cursor) -> $sort { _id: -1 } -> $limit
  -> $lookup { from: 'users', localField: 'author', foreignField: '_id',
               pipeline: [ $project { name: 1 } ], as: 'author' }
  -> $unwind { path: '$author', preserveNullAndEmptyArrays: true }
  -> $project { __v: 0 }
```

The inner `$project` keeps only the name, so no email, password or role can leak. The
outer `$sort` + `$limit` is still served by the default `_id` index (`IXSCAN: _id_`).

## Project structure

```
src/
├── config/
│   ├── db.js          # MongoDB connection
│   ├── paths.js       # Path resolution (dev/bundled)
│   └── socket.js      # Socket.io setup
├── controllers/       # auth, note, post, user, upload request handlers
├── middleware/
│   ├── auth.js        # isAuthenticated, requireRole
│   ├── catchAsyncError.js
│   ├── error.js       # Global error handler
│   └── upload.js      # Multer configuration
├── models/            # Mongoose models + schema.index()
├── routes/            # /api/auth, /api/notes, /api/posts, /api/users, /api/upload
├── seeds/
│   └── seedAdmin.js   # Admin user creation
├── services/          # Business logic (auth, note, post, user, upload)
├── utils/             # ApiError, ApiResponse, cursor pagination, interest normalisation
├── app.js             # Express app (cors, json, routes, error handler)
└── index.js           # Entry point (HTTP + Socket.io server)
```

## Available scripts

| Command | Description |
| ------- | ----------- |
| `npm start` | Start the server |
| `npm run dev` | Start the dev server with nodemon |
| `npm run seed:admin` | Create the admin user from `ADMIN_SEED_*` |
| `npm run pm2:start` | Start under PM2 (development env) |
| `npm run pm2:start:prod` | Start under PM2 (production env) |
| `npm run pm2:stop` | Stop the PM2 process |
| `npm run pm2:logs` | View PM2 logs |

## Environment variables

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection string | required |
| `JWT_SECRET` | JWT signing secret (random, 32+ chars) | required |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `CORS_ORIGIN` | Comma-separated allowed origins | `*` (not usable from a browser) |
| `BASE_URL` | Base URL for uploaded-file links | `http://localhost:3000` |
| `ADMIN_SEED_*` | Values used by `npm run seed:admin` | see `.env.example` |

## PM2

`ecosystem.config.js` runs a single fork-mode instance with auto-restart (max 10 restarts,
a 500MB memory limit), logs into `logs/`, and reads `PORT` from the environment.
