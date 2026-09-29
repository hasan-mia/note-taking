I have an existing Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + shadcn/ui + TanStack Query + Zustand + Axios project (a multi-tenant project/task UI). Convert it IN PLACE into "notes-ui", a minimal frontend for my Notes REST API. Frontend design is NOT a priority: functionality and API integration only. Do not add new UI libraries. Reuse the existing shadcn/ui components, api-client, providers and layout shell.

## Step 0: Read the backend first
The backend is in ../notes-api (or ask me for the path). Read src/routes, src/controllers and src/utils (ApiResponse, pagination) and confirm the exact request/response shapes for: login, register, /auth/me, notes, users, grouped-by-interests, and /users/:id/posts. Use those exact shapes for the TypeScript types. Do not guess field names (for example the user has `password`-less responses, `_id` not `id`).

## Step 1: REMOVE (out of scope)
- features/projects, features/tasks, features/reports, recharts, the metrics dashboard, the task data table, and any tenant/project/task code, routes and nav items.
- Refresh-token rotation logic in lib/api-client (this API has NO refresh endpoint). On 401: clear the session and redirect to /login.
- Permission-code logic (hasPermission, permission codes, <Can permission>). Roles are FIXED: 'user' and 'admin'.
- Remove unused dependencies from package.json afterwards.

## Step 2: Config
- .env.example and .env.local: NEXT_PUBLIC_API_URL=http://localhost:3000 and PORT=3001 for the UI (the API already uses 3000).
- The API already has cors() open, so no backend change is needed.

## Step 3: Auth
- Zustand persisted store: { token, user, setSession, logout } and a helper isAdmin.
- Pages: /login and /register (register creates role 'user' only). After login, store token + user and redirect to /dashboard/notes.
- Axios interceptor attaches Authorization: Bearer <token>.
- Dashboard layout guard: if no token, redirect to /login; otherwise restore the profile with GET /api/auth/me.
- Replace <Can permission> with <RoleGate role="admin"> that renders children only if user.role === 'admin'.

## Step 4: Pages (App Router)
All list screens use cursor pagination with TanStack useInfiniteQuery: GET ...?limit=10&after=<nextCursor>, getNextPageParam = meta.nextCursor (only when meta.hasMore), and a "Load more" button.

1. /dashboard/notes
   - Lists notes. Normal user sees own notes; admin sees ALL notes (the API decides) and the page shows the owner for admin.
   - Create note dialog, edit dialog (PUT /api/notes/:id), delete with confirm (DELETE /api/notes/:id). Invalidate the query after each mutation.
2. /dashboard/users (admin only, guard with RoleGate and redirect non-admins)
   - Paginated users list with "Load more".
   - Create user (POST /api/users: name, email, password, role, interests as comma-separated input), edit (PUT), delete (DELETE). Disable delete for the logged-in admin.
3. /dashboard/interests (admin only)
   - Calls GET /api/users/grouped-by-interests, with an optional "interest" text filter input (?interest=chess).
   - Shows each interest with count and the list of user names.
4. /dashboard/posts
   - Form to create a post (POST /api/posts: title, content).
   - Input for a user id (default: current user's id) that loads GET /api/users/:id/posts (public endpoint, Scenario 2) with "Load more" using the cursor the API returns.
   - Show the user's name and their posts.
- Sidebar nav: Notes, Posts for everyone; Users and Interests only for admin (via RoleGate). Include a user menu with logout.

## Step 5: Errors and UX
- Show API error messages (from response.data.message) in toasts.
- Loading and empty states for each list. Keep styling default shadcn, no extra design effort.

## Step 6: Cleanup and README
- Update site config (name "Notes UI"), nav config, and remove all leftover multi-tenant text.
- Rewrite README.md: purpose, tech stack, setup (API on 3000, UI on 3001, NEXT_PUBLIC_API_URL), pages list, how roles affect the UI, and this sentence: "UI is built on my own personal Next.js setup (shadcn/ui, TanStack Query, Zustand). All pages, API integration and role handling were written for this task."
- Run `npm run typecheck` and `npm run lint` and fix errors.

When done, print: the list of routes/pages, the list of removed folders, and the typecheck result.