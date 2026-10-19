# CICTE Lab Monitor

A React and Supabase dashboard for monitoring lab workstations, PC condition,
repairs, schedules, users, and agent heartbeats.

Requires Node.js 22.12 or newer.

## Quick Start

```bash
npm ci
cp .env.example .env
```

The API server requires all of these values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=...
TOKEN_SECRET=...
AGENT_KEY=...
ADMIN_USER=...
ADMIN_PASS=...
VIEWER_USER=...
VIEWER_PASS=...
CORS_ORIGIN=http://localhost:5173
```

There are no default secrets or default user passwords. Apply the SQL in
`supabase/schema.sql` and `supabase/migrations/`, then seed the database:

```bash
npm run seed
```

The server and seeder load `.env` automatically. Seeding upserts sample PC records and can overwrite existing data; run it only when initializing a demonstration database.

Start both services without reseeding:

```bash
npm run dev:full
```

Or run the API and frontend separately:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

Open http://localhost:5173.

For a containerized deployment:

```bash
docker compose up --build
```

The container reads secrets from `.env` and serves the production frontend and
API on port 3001.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev:full` | Start API and frontend together without reseeding |
| `npm run dev` | Start the Vite development server |
| `npm run server` | Start the Node API server |
| `npm run seed` | Upsert labs, PCs, and explicitly configured seed users |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm test` | Run the Vitest suite |
| `npm run build` | Type-check and build the production frontend |
| `npm audit` | Check dependency vulnerabilities |

## Features

- Lab map with drag-and-drop PC and furniture layouts
- PC registry, filters, detail panels, repairs, and batch actions
- Analytics and lab schedules
- Role-based access for admin, staff, student volunteers, and students
- Supabase-backed labs, PCs, and user accounts
- Signed API sessions and role-aware sensitive-field filtering
- PC heartbeat agent with online/offline tracking
- Local maintenance hub for tickets, schedules, inventory, and activity data

## Project Structure

```text
src/components/   Reusable dashboard and floor-plan components
src/pages/        Map, list, analytics, maintenance, login, and user views
src/hooks/        API, socket, heartbeat, keyboard, and reminder hooks
src/store/        Zustand stores for auth, layout, notifications, and UI data
src/lib/          API environment, catalog, mock data, and utilities
server/           Node API and Supabase seed script
agent/            Python heartbeat agent and setup documentation
supabase/         Database schema and migrations
```

The legacy JSON database and unused `FloorPlans.tsx` component were removed.
The maintenance feature still uses local stores because its backend endpoints
have not been implemented; lab and PC monitoring use the API.

## API Overview

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/api/health` | Public health check |
| `POST` | `/api/auth/login` | Public login |
| `GET` | `/api/auth/me` | Authenticated |
| `GET` | `/api/labs` | Authenticated |
| `GET` | `/api/labs/:labId/pcs` | Authenticated |
| `PATCH` | `/api/pcs/:id` | Admin, staff, volunteer |
| `POST` | `/api/pcs/:id/repairs` | Admin, staff, volunteer |
| `GET/POST/PATCH/DELETE` | `/api/users...` | Admin, staff |
| `POST` | `/api/agent/heartbeat` | Agent key |
| `GET` | `/api/agent/status` | Admin, staff |

## Security

- Keep `.env` out of version control.
- Generate random `TOKEN_SECRET` and `AGENT_KEY` values.
- Rotate credentials immediately if they are exposed.
- Deploy agent heartbeats over HTTPS.
- The Supabase service-role key must remain server-side.
- Dependency audits run through `.github/workflows/dependency-audit.yml`.

## Verification

PC edits now wait for API confirmation before reporting success. Batch edits report partial failures and retain failed selections for retry. Polling refreshes the active lab and selected PC every 15 seconds after login, without synthetic heartbeats.

Run lint, tests, and the production build using the commands above. Live Supabase round-trip verification still requires configured credentials. Generated analytics history and browser-local maintenance features remain outside the persistence changes.
