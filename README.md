# CCIS Com Lab Monitoring

## Tech Stack

### Frontend
- **React** (TypeScript)
- **Vite** (build tool)
- **Tailwind CSS** (utility-first CSS framework)

### Backend
- **Node.js** (server-side JavaScript)
- **Express** (likely, based on `index.mjs`)
- **Supabase** (PostgreSQL, schema and migrations)
- **JSON server** (mock data via `db.json`)

### Agent
- **Python** (automation/scripts)

### Testing
- **Vitest** (unit testing for frontend)

### DevOps
- **Docker** (Dockerfile, docker-compose)

---

## Project Structure
- `src/` — React frontend code
- `server/` — Node.js backend and mock data
- `agent/` — Python scripts/automation
- `supabase/` — Database schema and migrations
- `public/` — Static assets

---

## Setup

### Prerequisites
- Node.js
- Docker
- Python 3

### Install dependencies
```bash
cd cicte-lab-monitor
npm install
```

### Start development server
```bash
npm run dev
```

### Run backend (mock server)
```bash
# Example, adjust as needed
node server/index.mjs
```

### Run agent
```bash
cd agent
python agent.py
```

### Database
- Supabase schema in `supabase/schema.sql`
- Migrations in `supabase/migrations/`

### Docker
```bash
cd cicte-lab-monitor
# Build and run containers
docker-compose up --build
```

---

## Testing
```bash
npm run test
```

---

## License
See LICENSE file.

---

## Contributing
1. Fork the repo
2. Create a feature branch
3. Submit a pull request

---

## Contact
For questions, open an issue or contact the maintainers.
