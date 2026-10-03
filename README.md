# CICTE Lab Monitor

Computer laboratory monitoring and inventory dashboard for CICTE labs.

## Stack

- React 18, TypeScript, Tailwind CSS, Vite
- Zustand and TanStack Query for client state and API data
- Node.js HTTP API server
- Supabase PostgreSQL with RLS-protected tables
- Python PC heartbeat agent
- Vitest, ESLint, Docker Compose, and GitHub Actions dependency auditing

## Repository Layout

```text
cicte-lab-monitor/
  src/        React frontend
  server/     API server and Supabase seed script
  agent/      PC heartbeat agent and installation instructions
  supabase/   schema and migrations
  public/     frontend assets
.github/      CI workflows
```

## Local Setup

```bash
cd cicte-lab-monitor
npm ci
cp .env.example .env
```

Configure `.env` before starting the API:

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

All server secrets and account credentials are required. The application has no
development credential fallbacks.

Apply the SQL files in `cicte-lab-monitor/supabase/`, then seed the database:

```bash
npm run seed
```

Start the API and frontend in separate terminals:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

Open http://localhost:5173.

## Commands

```bash
npm run lint       # ESLint with zero warnings allowed
npm test           # Vitest suite
npm run build      # TypeScript check and production build
npm audit          # Dependency security audit
```

The maintenance hub currently uses local Zustand/mock data because its ticket,
schedule, inventory, and activity APIs have not been implemented yet. Lab and
PC data use the Supabase API.

## PC Agent

Configure the agent through environment variables. `CICTE_AGENT_KEY` must match
the server's `AGENT_KEY`; no default key is provided. Use HTTPS for deployed
agents because heartbeat requests include the shared authentication key.

See [agent/README.md](cicte-lab-monitor/agent/README.md) for installation and
Windows scheduled-task instructions.

## Security and Maintenance

- Never commit `.env`, Supabase service keys, agent keys, or PC credentials.
- Rotate any secret that has appeared in logs, chat, test files, or Git history.
- RLS is enabled on the Supabase tables; the service-role key is server-only.
- Dependency auditing runs on dependency changes, pull requests, pushes, and a
  weekly schedule through `.github/workflows/dependency-audit.yml`.

## Verification

The rebuilt project currently passes lint, all 43 tests, the production build,
and `npm audit --audit-level=high`.

See [cicte-lab-monitor/README.md](cicte-lab-monitor/README.md) for the detailed
application and API reference.

## License

See [LICENSE](LICENSE).
