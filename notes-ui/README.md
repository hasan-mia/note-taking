# Notes UI

A **Next.js 16** front end for the Notes REST API (Express, MongoDB, JWT). It talks to the
API directly from the browser with a Bearer access token and covers the four product areas
of the API:

1. **Notes** — create, edit, delete and browse your own notes (admins see all notes, with the owner shown)
2. **Posts** — create a post, see every post in the system with its author's name, and
   browse any user's posts through the public `GET /api/users/:id/posts` cursor-paginated
   endpoint
3. **Users** (admin only) — paginated user list with create / edit / delete
4. **Interests** (admin only) — users grouped by interest, with a count and member names

The visual style is intentionally minimal: the focus is functionality and API integration.
Styling is plain shadcn/ui, and no extra UI libraries were added.

UI is built on my own personal Next.js setup (shadcn/ui, TanStack Query, Zustand).
All pages, API integration and role handling were written for this task.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + shadcn/ui
- **TanStack Query** for data fetching and cursor pagination
- **Zustand** (persisted) for the auth session
- **Axios** API client with a Bearer-token request interceptor
- **sonner** for toast messages

## Setup

The API must be running on port 3000 (see [`../notes-api`](../notes-api)).

```bash
cd notes-ui
npm install
cp .env.example .env   # already points at http://localhost:3000
npm run dev            # http://localhost:3001
```

| Variable | Value | Purpose |
| -------- | ----- | ------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | API base URL — `/api` is appended in `src/lib/api-client.ts` |
| `PORT` | `3001` | Port the Next.js dev server binds to |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3001` | Client-side URL building |

> The API reads allowed origins from `CORS_ORIGIN`, so `http://localhost:3001` must be
> listed there. Browser calls from any other origin are blocked.

Sign in with the seeded admin, or register from `/register` (registration always creates a
`user`).

## Pages

| Route | Access | What it does |
| ----- | ------ | ------------ |
| `/` | public | Redirects to `/dashboard` |
| `/login` | public | Email + password sign-in; stores the token and redirects to `/dashboard/notes` |
| `/register` | public | Creates a new account with optional interests (the API forces role `user`). Each auth page links to the other. |
| `/dashboard` | public | Redirects to `/dashboard/notes` |
| `/dashboard/notes` | user + admin | Cursor-paginated notes with create, edit and delete. A normal user sees their own notes; an admin sees all of them and each card shows the owner. |
| `/dashboard/posts` | user + admin | Two lists, both paginating with "Load more": **All posts** (`GET /api/posts`, public — every post in the system, each showing its author's name) and **a user's posts** (`GET /api/users/:id/posts`). A normal user just sees their own posts; an admin picks any user by name from a dropdown, with that user's email and id shown underneath. |
| `/dashboard/users` | **admin** | Paginated users with create, edit and delete. Delete is disabled for the signed-in admin. |
| `/dashboard/interests` | **admin** | `GET /api/users/grouped-by-interests` with an optional `?interest=` filter, showing each interest with its count and user names. |

## How roles affect the UI

Roles are fixed to `'user'` and `'admin'` — there is no permission-code system.

- `useAuthStore.isAdmin()` and `<RoleGate role="admin">` decide what is rendered.
- The sidebar shows **Notes** and **Posts** to everyone; **Users** and **Interests** only
  to admins.
- `/dashboard/users` and `/dashboard/interests` are wrapped in `<RoleGate role="admin">`;
  a non-admin sees an "Admins only" message and is redirected to `/dashboard/notes`.
- The API remains the source of truth: a normal user only receives their own notes from
  `GET /api/notes`, and the user-management endpoints are admin-only server-side.

## Auth and error handling

- The persisted Zustand store keeps `{ token, user }` under the `notes-auth` key and
  exposes `setSession`, `logout` and `isAdmin`.
- The Axios request interceptor attaches `Authorization: Bearer <token>`.
- This API has **no refresh endpoint**: on any `401` the session is cleared and the browser
  is redirected to `/login`.
- The dashboard layout guard restores the profile with `GET /api/auth/me` when a token
  exists but no user is loaded.
- API error messages (`response.data.message`) are surfaced as `sonner` toasts.

## Pagination

Every list uses `useInfiniteQuery` through `src/hooks/use-cursor-pagination.ts`:

- requests: `GET ...?limit=10&after=<nextCursor>`
- `getNextPageParam` returns `meta.nextCursor` only when `meta.hasMore` is true
- a "Load more" button is rendered while more pages exist

Every mutation invalidates its query key, so lists refresh after a create, update or delete.

## Project structure

```
notes-ui/
├── .env / .env.example            # NEXT_PUBLIC_API_URL, PORT
├── components.json                # shadcn/ui config
└── src/
    ├── app/
    │   ├── layout.tsx             # root providers (theme, query, toasts)
    │   ├── page.tsx               # redirect → /dashboard
    │   ├── login/ register/       # auth pages, with links to each other
    │   └── dashboard/
    │       ├── layout.tsx         # auth guard + sidebar shell
    │       ├── page.tsx           # redirect → /dashboard/notes
    │       ├── notes/             # notes list
    │       ├── posts/             # posts page
    │       ├── users/             # admin only
    │       └── interests/         # admin only
    ├── components/
    │   ├── ui/                    # shadcn/ui primitives
    │   ├── auth/                  # auth-guard, role-gate, admin-only
    │   ├── common/                # load-more, confirm-delete-dialog
    │   ├── layout/                # sidebar, header, user menu, theme toggle
    │   └── providers/             # app / query / theme providers
    ├── config/                    # site + navigation config
    ├── features/
    │   ├── auth/                  # types, api, store, login & register forms
    │   ├── notes/                 # api + list & form dialogs
    │   ├── posts/                 # api + list & form dialogs
    │   ├── users/                 # types, api, list & form dialogs
    │   └── interests/             # api + grouped list
    ├── hooks/                     # use-cursor-pagination, use-debounce, use-mobile
    └── lib/                       # api-client, api-error, utils
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier |
